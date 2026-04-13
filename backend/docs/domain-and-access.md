# HomeFlow Domain Relations and Access Matrix

## Entity Relations

- User -> Subscription: 1:N
- Subscription -> CleaningOrder: 1:N
- User -> CleaningOrder: 1:N
- CleaningOrder -> Schedule: 1:1
- Subscription -> Schedule: 1:N
- User -> Schedule: 1:N

## Roles

- Guest: unauthorized user, limited read-only access to public info
- User: client role for subscriptions and own orders
- Cleaner: operational role for assigned orders and photo reports
- Admin: full system access

## Key Actions by Entity

- User: register, read own profile, update own profile, delete own account
- Subscription: create, read, update, cancel, pause, resume
- CleaningOrder: create, read, update, cancel, assign cleaner
- Schedule: create, read, update, delete, reschedule, generate orders
- Cleaner: create, read, update, deactivate/activate, assign to order
- Notification: create, read, update read status, delete
- Room: create, read, update, delete
- Service: create, read, update, delete, publish, unpublish
- PhotoReport: create, read, update, delete, approve, reject

## Access Matrix (Current Backend Baseline)

Current code provides:

- Guest can register and login via auth endpoints
- Authenticated roles (User, Cleaner, Admin) can access /auth/me
- JWT payload includes role for further role-based guards
- Roles decorator and RolesGuard are implemented for endpoint-level policies

Planned endpoint-level enforcement can follow this matrix:

- Guest:
  - read public service info
  - register/login
- User:
  - CRUD own profile
  - CRUD own subscriptions
  - CRUD own orders
  - read own notifications
  - read own photo reports
- Cleaner:
  - read assigned orders
  - update assigned order status
  - upload photo reports for assigned orders
- Admin:
  - full read/write across users, subscriptions, orders, cleaners, services, notifications
  - assign cleaners
  - approve/reject photo reports
