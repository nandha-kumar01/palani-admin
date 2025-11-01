import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { withAuth } from '@/lib/middleware';
import { hashPassword } from '@/lib/auth';
import { withTimeout, handleApiError } from '@/lib/apiTimeout';


async function getUser(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    const user = await withTimeout(User.findOne({ 
      _id: id, 
      isDeleted: { $ne: true } 
    }).maxTimeMS(10000)
      .populate('groupId', 'name description')
      .lean(), 15000, 'Database operation timeout');
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Remove password field manually
    if (user && typeof user === 'object' && 'password' in user) {
      const { password: _, ...userWithoutPassword } = user as any;
      return NextResponse.json({ success: true, user: userWithoutPassword });
    }
    
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function updateUser(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const updateData = await request.json();
    
    // Handle WhatsApp number - ensure proper handling
    if (updateData.whatsappNumber === undefined) {
      updateData.whatsappNumber = '';
    }
    
    // Remove password field if empty
    if (updateData.password === '' || updateData.password === undefined) {
      delete updateData.password;
    } else if (updateData.password) {
      // Hash password if provided
      updateData.password = await hashPassword(updateData.password);
    }

    // Handle group assignment
    if ('groupId' in updateData) {
      const Group = require('@/models/Group').default;
      const currentUser = await withTimeout(User.findOne({ 
        _id: id, 
        isDeleted: { $ne: true } 
      }).maxTimeMS(10000), 15000, 'Database operation timeout') as any;
      
      if (updateData.groupId) {
        // User is joining a group
        
        // Validate group exists
        const group = await withTimeout(Group.findById(updateData.groupId).maxTimeMS(10000), 15000, 'Database operation timeout') as any;
        if (!group) {
          return NextResponse.json({ success: false, error: 'Selected group does not exist' },
            { status: 400 }
          );
        }
        
        // Check if group has space (excluding current user)
        const currentMemberCount = await withTimeout(User.countDocuments({ 
          groupId: updateData.groupId,
          _id: { $ne: id }
        }).maxTimeMS(10000), 15000, 'Database operation timeout') as number;
        if (currentMemberCount >= group.maxMembers) {
          return NextResponse.json({ success: false, error: 'Selected group is full' },
            { status: 400 }
          );
        }
        
        // Remove user from previous group if exists
        if (currentUser.groupId && currentUser.groupId.toString() !== updateData.groupId) {
          await withTimeout(await Group.findByIdAndUpdate(
            currentUser.groupId,
            { $pull: { members: id } }
          ), 15000, 'Database operation timeout');
        }
        
        // Add user to new group
        await withTimeout(await Group.findByIdAndUpdate(
          updateData.groupId,
          { $addToSet: { members: id } }
        ), 15000, 'Database operation timeout');
        
        // Set joinedGroupAt if user is joining a group for the first time
        if (!currentUser.groupId) {
          updateData.joinedGroupAt = new Date();
        }
      } else {
        // User is leaving group
        if (currentUser.groupId) {
          await withTimeout(await Group.findByIdAndUpdate(
            currentUser.groupId,
            { $pull: { members: id } }
          ), 15000, 'Database operation timeout');
        }
        updateData.groupId = null;
        updateData.joinedGroupAt = null;
      }
    }
    
    const user = await withTimeout(User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('groupId', 'name description')
     .lean(), 15000, 'Database operation timeout');
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Remove password field manually
    if (user && typeof user === 'object' && 'password' in user) {
      const { password: _, ...userWithoutPassword } = user as any;
      
      return NextResponse.json({ 
        success: true, 
        message: 'User updated successfully',
        user: userWithoutPassword
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'User updated successfully',
      user
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: 'Email or phone already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json({ success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function deleteUser(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';
    
    const user = await withTimeout(User.findOne({ 
      _id: id, 
      ...(permanent ? {} : { isDeleted: { $ne: true } })  // For permanent delete, find any user including deleted ones
    }).maxTimeMS(10000), 15000, 'Database operation timeout') as any;
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Prevent deletion of admin users
    if (user.isAdmin && !permanent) {
      return NextResponse.json({ success: false, error: 'Cannot delete admin users' },
        { status: 403 }
      );
    }

    // Remove user from group if they belong to one
    if (user.groupId) {
      const Group = require('@/models/Group').default;
      await withTimeout(await Group.findByIdAndUpdate(
        user.groupId,
        { $pull: { members: id } }
      ), 15000, 'Database operation timeout');
    }
    
    if (permanent) {
      // HARD DELETE: Permanently remove user from database
      await withTimeout(await User.findByIdAndDelete(id), 15000, 'Database operation timeout');
      
      return NextResponse.json({ 
        success: true, 
        message: 'User permanently deleted from database successfully'
      });
    } else {
      // SOFT DELETE: Mark as deleted without changing user status or tracking
      await withTimeout(await User.findByIdAndUpdate(id, {
        isDeleted: true,
        deletedAt: new Date(),
        groupId: null,  // Remove from group when deleted
      }), 15000, 'Database operation timeout');
      
      return NextResponse.json({ 
        success: true, 
        message: 'User moved to deleted users successfully'
      });
    }
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getUser, true);
export const PUT = withAuth(updateUser, true);
export const DELETE = withAuth(deleteUser, true);
