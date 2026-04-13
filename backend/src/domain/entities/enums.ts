export enum SubscriptionFrequency {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
}

export enum OrderStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  AWAITING_CONFIRMATION = 'awaiting_confirmation',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled',
}

export enum UserType {
  YOUNG_PROFESSIONAL = 'young_professional',
  FAMILY = 'family',
}

export enum UserRole {
  USER = 'user',
  CLEANER = 'cleaner',
  ADMIN = 'admin',
}

export enum CleanerStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  INACTIVE = 'inactive',
}

export enum NotificationType {
  ORDER_REMINDER = 'order_reminder',
  ORDER_STATUS = 'order_status',
  CLEANER_ASSIGNED = 'cleaner_assigned',
  SUBSCRIPTION_BILLING = 'subscription_billing',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
}

export enum RoomType {
  BEDROOM = 'bedroom',
  BATHROOM = 'bathroom',
  KITCHEN = 'kitchen',
  LIVING_ROOM = 'living_room',
  HALLWAY = 'hallway',
  OTHER = 'other',
}

export enum ServiceCategory {
  BASIC_CLEANING = 'basic_cleaning',
  DEEP_CLEANING = 'deep_cleaning',
  REPAIR = 'repair',
  SUPPLIES = 'supplies',
  OTHER = 'other',
}
