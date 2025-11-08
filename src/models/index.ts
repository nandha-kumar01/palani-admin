// Central model registration for serverless environments
import User from './User';
import Madangal from './Madangal';
import Announcement from './Announcement';
import Temple from './Temple';
import Group from './Group';
import Device from './Device';
import Gallery from './Gallery';
import Notification from './Notification';
import Quote from './Quote';
import Song from './Song';
import Annadhanam from './Annadhanam';
import UserSupport from './UserSupport';
import City from './City';
import Country from './Country';
import State from './State';

// Export all models to ensure they are registered
export {
  User,
  Madangal,
  Announcement,
  Temple,
  Group,
  Device,
  Gallery,
  Notification,
  Quote,
  Song,
  Annadhanam,
  UserSupport,
  City,
  Country,
  State,
};

// Function to ensure all models are loaded in serverless environment
export function initializeModels() {
  // This function ensures all models are loaded and registered
  return {
    User,
    Madangal,
    Announcement,
    Temple,
    Group,
    Device,
    Gallery,
    Notification,
    Quote,
    Song,
    Annadhanam,
    UserSupport,
    City,
    Country,
    State,
  };
}
