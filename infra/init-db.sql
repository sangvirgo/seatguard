-- SeatGuard — Initialize databases for all services
-- This script runs on first postgres container start

-- Create databases for each service
CREATE DATABASE seatguard_auth;
CREATE DATABASE seatguard_event;
CREATE DATABASE seatguard_booking;
CREATE DATABASE seatguard_ticket;
CREATE DATABASE seatguard_notification;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE seatguard_auth TO seatguard;
GRANT ALL PRIVILEGES ON DATABASE seatguard_event TO seatguard;
GRANT ALL PRIVILEGES ON DATABASE seatguard_booking TO seatguard;
GRANT ALL PRIVILEGES ON DATABASE seatguard_ticket TO seatguard;
GRANT ALL PRIVILEGES ON DATABASE seatguard_notification TO seatguard;
