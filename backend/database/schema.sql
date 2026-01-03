-- =====================================================
-- NamSev - Panchayat Civic Engagement Platform
-- MySQL Database Schema
-- =====================================================

-- Create database
CREATE DATABASE IF NOT EXISTS namsev_db;
USE namsev_db;

-- =====================================================
-- Users Table
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    address TEXT NOT NULL,
    aadhaar_last4 VARCHAR(4),
    panchayat_code VARCHAR(20) NOT NULL DEFAULT 'TIRU001',
    role ENUM('citizen', 'admin') DEFAULT 'citizen',
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_firebase_uid (firebase_uid),
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_panchayat (panchayat_code)
);

-- =====================================================
-- Complaints Table
-- =====================================================
CREATE TABLE IF NOT EXISTS complaints (
    id VARCHAR(36) PRIMARY KEY,
    tracking_id VARCHAR(20) UNIQUE NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category ENUM(
        'Road & Infrastructure',
        'Water Supply',
        'Electricity',
        'Sanitation',
        'Street Lights',
        'Drainage',
        'Public Health',
        'Encroachment',
        'Noise Pollution',
        'Other'
    ) NOT NULL,
    location VARCHAR(255),
    status ENUM('pending', 'in_progress', 'resolved', 'rejected') DEFAULT 'pending',
    admin_remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_tracking (tracking_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_category (category),
    INDEX idx_created (created_at)
);

-- =====================================================
-- Complaint History Table (Status Tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS complaint_history (
    id VARCHAR(36) PRIMARY KEY,
    complaint_id VARCHAR(36) NOT NULL,
    status ENUM('pending', 'in_progress', 'resolved', 'rejected') NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    
    INDEX idx_complaint (complaint_id),
    INDEX idx_created (created_at)
);

-- =====================================================
-- Announcements Table
-- =====================================================
CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_active (is_active),
    INDEX idx_priority (priority),
    INDEX idx_created (created_at)
);

-- =====================================================
-- Sample Data (Optional - for testing)
-- =====================================================

-- Note: You'll need to create the admin user through the app first
-- This is just for reference

-- Sample announcement
-- INSERT INTO announcements (id, title, content, priority, is_active, created_at)
-- VALUES (
--     UUID(),
--     'Welcome to NamSev',
--     'Welcome to the Panchayat Civic Engagement Platform. Register to report issues and stay updated.',
--     'high',
--     true,
--     NOW()
-- );
