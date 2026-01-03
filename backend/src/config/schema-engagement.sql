-- =====================================================
-- PANCHAYAT ENGAGEMENT PLATFORM - EXTENDED SCHEMA
-- =====================================================

-- 1. GRAM SABHA / PUBLIC MEETINGS
CREATE TABLE IF NOT EXISTS gram_sabha_meetings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    meeting_date DATETIME NOT NULL,
    meeting_time VARCHAR(20),
    venue VARCHAR(255) NOT NULL,
    description TEXT,
    agenda TEXT,
    status ENUM('upcoming', 'ongoing', 'completed', 'cancelled') DEFAULT 'upcoming',
    minutes_pdf_url VARCHAR(500),
    decisions TEXT,
    attendance_count INT DEFAULT 0,
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Meeting attendance RSVP
CREATE TABLE IF NOT EXISTS meeting_rsvp (
    id INT PRIMARY KEY AUTO_INCREMENT,
    meeting_id INT NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    will_attend ENUM('yes', 'no', 'maybe') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES gram_sabha_meetings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_rsvp (meeting_id, user_id)
);

-- 2. GOVERNMENT SCHEMES
CREATE TABLE IF NOT EXISTS government_schemes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    eligibility TEXT,
    documents_required TEXT,
    benefits TEXT,
    last_date DATE,
    category ENUM('agriculture', 'education', 'health', 'housing', 'women', 'senior_citizen', 'employment', 'central', 'state', 'local', 'other') DEFAULT 'other',
    is_active BOOLEAN DEFAULT TRUE,
    application_link VARCHAR(500),
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- User bookmarked schemes
CREATE TABLE IF NOT EXISTS scheme_bookmarks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    scheme_id INT NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (scheme_id) REFERENCES government_schemes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_bookmark (scheme_id, user_id)
);

-- 3. EMERGENCY ALERTS
CREATE TABLE IF NOT EXISTS emergency_alerts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    alert_type ENUM('weather', 'flood', 'water_contamination', 'road_block', 'power_outage', 'health', 'general') DEFAULT 'general',
    severity ENUM('info', 'low', 'medium', 'warning', 'high', 'danger', 'critical') DEFAULT 'medium',
    is_active BOOLEAN DEFAULT TRUE,
    expires_at DATETIME,
    affected_areas VARCHAR(500),
    instructions TEXT,
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 4. POLLS & SURVEYS
CREATE TABLE IF NOT EXISTS polls (
    id INT PRIMARY KEY AUTO_INCREMENT,
    question VARCHAR(500) NOT NULL,
    description TEXT,
    poll_type ENUM('single_choice', 'multiple_choice') DEFAULT 'single_choice',
    status ENUM('draft', 'active', 'closed') DEFAULT 'draft',
    is_active BOOLEAN DEFAULT TRUE,
    starts_at DATETIME,
    end_date DATETIME,
    ends_at DATETIME,
    show_results BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS poll_options (
    id INT PRIMARY KEY AUTO_INCREMENT,
    poll_id INT NOT NULL,
    option_text VARCHAR(255) NOT NULL,
    vote_count INT DEFAULT 0,
    display_order INT DEFAULT 0,
    FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS poll_votes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    poll_id INT NOT NULL,
    option_id INT NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
    FOREIGN KEY (option_id) REFERENCES poll_options(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_vote (poll_id, user_id)
);

-- 5. PUBLIC SUGGESTIONS (Non-Complaint)
CREATE TABLE IF NOT EXISTS public_suggestions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category ENUM('development', 'infrastructure', 'environment', 'education', 'health', 'transport', 'other') DEFAULT 'other',
    location VARCHAR(255),
    status ENUM('pending', 'submitted', 'under_review', 'approved', 'implemented', 'rejected') DEFAULT 'pending',
    admin_remarks TEXT,
    upvotes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS suggestion_upvotes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    suggestion_id INT NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (suggestion_id) REFERENCES public_suggestions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_upvote (suggestion_id, user_id)
);

-- 6. COMMUNITY EVENTS & PROGRAMS
CREATE TABLE IF NOT EXISTS community_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type ENUM('health_camp', 'vaccination', 'awareness', 'training', 'cultural', 'sports', 'educational', 'religious', 'other') DEFAULT 'other',
    event_date DATETIME NOT NULL,
    start_time VARCHAR(20),
    end_time VARCHAR(20),
    end_date DATETIME,
    venue VARCHAR(255) NOT NULL,
    organizer VARCHAR(255),
    contact_info VARCHAR(255),
    image_url VARCHAR(500),
    is_free BOOLEAN DEFAULT TRUE,
    registration_required BOOLEAN DEFAULT FALSE,
    max_participants INT,
    status ENUM('upcoming', 'ongoing', 'completed', 'cancelled') DEFAULT 'upcoming',
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 7. PANCHAYAT WORKS TRACKER
CREATE TABLE IF NOT EXISTS panchayat_works (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    work_type ENUM('road', 'drainage', 'building', 'water', 'water_supply', 'electricity', 'sanitation', 'park', 'other') DEFAULT 'other',
    location VARCHAR(255) NOT NULL,
    contractor VARCHAR(255),
    budget_amount DECIMAL(12, 2),
    start_date DATE,
    expected_completion DATE,
    actual_completion DATE,
    progress_percentage INT DEFAULT 0,
    status ENUM('planned', 'in_progress', 'completed', 'delayed', 'cancelled') DEFAULT 'planned',
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS work_progress_updates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    work_id INT NOT NULL,
    update_text TEXT NOT NULL,
    progress_percentage INT,
    image_url VARCHAR(500),
    updated_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (work_id) REFERENCES panchayat_works(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 8. BUDGET & SPENDING OVERVIEW
CREATE TABLE IF NOT EXISTS budget_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(20),
    display_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS budget_entries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fiscal_year VARCHAR(10) NOT NULL,
    category_id INT NOT NULL,
    allocated_amount DECIMAL(12, 2) NOT NULL,
    spent_amount DECIMAL(12, 2) DEFAULT 0,
    description TEXT,
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES budget_categories(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 9. FAQ / HELP SECTION
CREATE TABLE IF NOT EXISTS faqs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    question VARCHAR(500) NOT NULL,
    answer TEXT NOT NULL,
    category ENUM('general', 'complaints', 'schemes', 'documents', 'services', 'meetings', 'taxes', 'technical') DEFAULT 'general',
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 10. NEWS/UPDATES (Replace hardcoded news)
CREATE TABLE IF NOT EXISTS news_updates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    summary VARCHAR(500),
    category ENUM('notice', 'meeting', 'development', 'scheme', 'event', 'announcement', 'general') DEFAULT 'general',
    image_url VARCHAR(500),
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    published_at DATETIME,
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default budget categories
INSERT INTO budget_categories (name, icon, color, display_order) VALUES
('Roads & Transport', 'road', '#3498db', 1),
('Water Supply', 'water', '#2ecc71', 2),
('Sanitation', 'trash', '#9b59b6', 3),
('Electricity', 'bolt', '#f39c12', 4),
('Education', 'book', '#e74c3c', 5),
('Healthcare', 'heart', '#1abc9c', 6),
('Administration', 'building', '#34495e', 7),
('Other', 'ellipsis', '#95a5a6', 8)
ON DUPLICATE KEY UPDATE name = name;

-- Insert sample FAQs
INSERT INTO faqs (question, answer, category, display_order, is_active) VALUES
('How do I register on NamSev portal?', 'Click on Register button, fill your details including Aadhaar number and address, then wait for admin approval.', 'general', 1, TRUE),
('How long does complaint resolution take?', 'Most complaints are resolved within 7-15 working days depending on the nature of the issue.', 'complaints', 2, TRUE),
('Who can see my complaint details?', 'Only you and the Panchayat officials can see your complaint details. Your information is kept confidential.', 'complaints', 3, TRUE),
('How do I apply for government schemes?', 'Visit the Schemes section, find eligible schemes, and follow the application link provided.', 'schemes', 4, TRUE),
('When are Gram Sabha meetings held?', 'Gram Sabha meetings are typically held quarterly. Check the Meetings section for upcoming dates.', 'meetings', 5, TRUE)
ON DUPLICATE KEY UPDATE question = question;
