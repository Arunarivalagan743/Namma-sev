const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import all models
const User = require('../src/models/User');
const Announcement = require('../src/models/Announcement');
const Complaint = require('../src/models/Complaint');
const ComplaintHistory = require('../src/models/ComplaintHistory');
const { GramSabhaMeeting } = require('../src/models/Meeting');
const { Poll, PollOption, PollVote } = require('../src/models/Poll');
const { GovernmentScheme } = require('../src/models/Scheme');
const { BudgetEntry, BudgetCategory } = require('../src/models/Budget');
const { FAQ, NewsUpdate } = require('../src/models/FAQ');
const { CommunityEvent } = require('../src/models/CommunityEvent');
const { PanchayatWork, WorkProgressUpdate } = require('../src/models/PanchayatWork');
const { PublicSuggestion, SuggestionUpvote } = require('../src/models/Suggestion');
const { EmergencyAlert } = require('../src/models/EmergencyAlert');

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected for mock data insertion');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// Mock data for Tirupur Ganapathipalayam Panchayat - ENGLISH VERSION (for translation API)
const mockData = {
    // Users (Admin and Citizens)
    users: [
        {
            name: 'Ganapathipalayam President',
            email: 'president@ganapathipalayam.tn.gov.in',
            phone: '+91 9876543210',
            address: 'Panchayat Office, Ganapathipalayam, Tirupur',
            role: 'admin',
            password: 'admin123',
            isApproved: true,
            approvalDate: new Date()
        },
        {
            name: 'Secretary Sivakumar',
            email: 'secretary@ganapathipalayam.tn.gov.in',
            phone: '+91 9876543211',
            address: 'Panchayat Office, Ganapathipalayam, Tirupur',
            role: 'admin',
            password: 'secretary123',
            isApproved: true,
            approvalDate: new Date()
        },
        {
            name: 'Velu Murugan',
            email: 'velu.murugan@gmail.com',
            phone: '+91 9876543212',
            address: 'Moolaiyar Street, Ganapathipalayam, Tirupur - 641652',
            role: 'citizen',
            password: 'citizen123',
            isApproved: true,
            approvalDate: new Date()
        },
        {
            name: 'Kamala Sundararajan',
            email: 'kamala.sundararajan@gmail.com',
            phone: '+91 9876543213',
            address: 'Perumal Kovil Street, Ganapathipalayam, Tirupur - 641652',
            role: 'citizen',
            password: 'citizen123',
            isApproved: true,
            approvalDate: new Date()
        },
        {
            name: 'Rajesh Kumar',
            email: 'rajesh.kumar@gmail.com',
            phone: '+91 9876543214',
            address: 'Bus Stand Road, Ganapathipalayam, Tirupur - 641652',
            role: 'citizen',
            password: 'citizen123',
            isApproved: true,
            approvalDate: new Date()
        },
        {
            name: 'Priya Vasudevan',
            email: 'priya.vasudevan@gmail.com',
            phone: '+91 9876543215',
            address: 'Anna Nagar, Ganapathipalayam, Tirupur - 641652',
            role: 'citizen',
            password: 'citizen123',
            isApproved: true,
            approvalDate: new Date()
        }
    ],

    // Announcements in English
    announcements: [
        {
            title: 'Pongal Celebration 2026',
            content: 'Everyone is invited! Pongal celebration will be held at Ganapathipalayam Panchayat premises on January 14, 15, 16. Traditional games, cultural programs, and special food distribution will be organized.',
            category: 'festival',
            priority: 'high',
            isActive: true,
            publishDate: new Date(),
            expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
        },
        {
            title: 'Drinking Water Supply - Notice',
            content: 'Water pipe repair works will be carried out from January 8 to 10. Water supply will be affected from 9 AM to 5 PM. Alternative arrangements have been made for emergency needs.',
            category: 'water',
            priority: 'high',
            isActive: true,
            publishDate: new Date(),
            expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        {
            title: 'Free Education Scholarship',
            content: 'Applications are invited for free education scholarship for the year 2026-27. Last date: February 28, 2026. Eligibility: Family income below Rs.50,000.',
            category: 'education',
            priority: 'normal',
            isActive: true,
            publishDate: new Date(),
            expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
        },
        {
            title: 'Free Medical Camp',
            content: 'Free medical camp will be held on January 12 from 9 AM to 3 PM at Panchayat Hall. General physician, eye specialist, and dental services will be available.',
            category: 'health',
            priority: 'high',
            isActive: true,
            publishDate: new Date(),
            expiryDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000)
        },
        {
            title: 'Road Improvement Works',
            content: 'Road improvement works from Perumal Kovil Street to Bus Stand will begin from January 20. Traffic will be diverted to alternative routes during the work.',
            category: 'infrastructure',
            priority: 'normal',
            isActive: true,
            publishDate: new Date(),
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
    ],

    // Meetings
    meetings: [
        {
            title: 'January Month Gram Sabha Meeting',
            description: 'Village development plans, drinking water supply, and health services will be discussed in the monthly Gram Sabha meeting.',
            date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
            time: '10:00',
            venue: 'Panchayat Hall, Ganapathipalayam',
            agenda: [
                'Review of last month activities',
                'Drinking water supply progress',
                'Status of road improvement works',
                'Education scholarship distribution',
                'Next month plans'
            ],
            isActive: true
        },
        {
            title: 'Women Self Help Group Meeting',
            description: 'Meeting on activities and new schemes for Women Self Help Groups.',
            date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
            time: '14:00',
            venue: 'Anganwadi Center Hall',
            agenda: [
                'Self Help Group progress',
                'Loan scheme consultation',
                'New skill development training',
                'Agricultural loan scheme'
            ],
            isActive: true
        }
    ],

    // Polls
    polls: [
        {
            title: 'Priority for Village Development?',
            description: 'Which sector should be prioritized for village development in the next financial year?',
            options: [
                'Road Improvement',
                'Drinking Water Supply',
                'Education Facilities',
                'Health Services',
                'Electricity Connection Improvement'
            ],
            endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
            allowMultiple: false,
            isActive: true,
            votes: []
        },
        {
            title: 'Pongal Celebration Programs',
            description: 'Which programs should be included in Pongal celebration?',
            options: [
                'Traditional Games',
                'Cultural Programs',
                'Cooking Competition',
                'Jallikattu',
                'Welcome and Prize Distribution'
            ],
            endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            allowMultiple: true,
            isActive: true,
            votes: []
        }
    ],

    // Schemes
    schemes: [
        {
            title: 'Pradhan Mantri Awas Yojana - Gramin (PMAY-G)',
            description: 'Central Government scheme to help poor families build free houses. Rs. 1.20 lakh financial assistance will be provided to eligible families.',
            category: 'housing',
            eligibilityCriteria: [
                'BPL family card required',
                'Family income should be below Rs.40,000',
                'Homeless or having kutcha house',
                'Family head should be above 18 years of age'
            ],
            benefits: [
                'Rs. 1.20 lakh financial assistance',
                'Free technical consultation',
                'Construction material subsidy'
            ],
            applicationProcess: [
                'Submit application at Social Welfare Office',
                'Attach all documents',
                'Get local body approval',
                'Wait for fund allocation'
            ],
            requiredDocuments: [
                'Income certificate',
                'Caste certificate',
                'BPL card',
                'Identity card',
                'Bank account details',
                'Land documents'
            ],
            budget: 500000,
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-12-31'),
            isActive: true
        },
        {
            title: 'Mahatma Gandhi National Rural Employment Guarantee Act (MGNREGA)',
            description: 'Scheme guaranteeing 100 days of work per year for rural families. Daily wage of Rs.220 will be provided.',
            category: 'employment',
            eligibilityCriteria: [
                'Rural residents',
                'Age should be above 18 years',
                'Ability to do physical labor',
                'Job card registration required'
            ],
            benefits: [
                '100 days of work guarantee per year',
                'Daily wage of Rs.220',
                'Unemployment allowance available',
                'Social protection'
            ],
            applicationProcess: [
                'Apply at Village Panchayat',
                'Get job card',
                'Report for work daily'
            ],
            requiredDocuments: [
                'Residence certificate',
                'Identity card',
                'Bank account details',
                'Photograph'
            ],
            budget: 2000000,
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-12-31'),
            isActive: true
        }
    ],

    // Budget
    budgets: [
        {
            year: '2026-27',
            title: 'Ganapathipalayam Panchayat Annual Budget',
            totalBudget: 5000000,
            allocations: [
                {
                    department: 'Water Supply',
                    amount: 1200000,
                    percentage: 24,
                    description: 'Drinking water pipe repairs, new connections, water quality testing'
                },
                {
                    department: 'Road Development',
                    amount: 1000000,
                    percentage: 20,
                    description: 'Road tarring, drainage construction, traffic safety'
                },
                {
                    department: 'Education',
                    amount: 800000,
                    percentage: 16,
                    description: 'School facility improvement, education scholarship, library facilities'
                },
                {
                    department: 'Health',
                    amount: 700000,
                    percentage: 14,
                    description: 'Primary health center, free medical camps, vaccination'
                },
                {
                    department: 'Environment',
                    amount: 600000,
                    percentage: 12,
                    description: 'Garbage removal, tree planting, green initiatives'
                },
                {
                    department: 'Social Welfare',
                    amount: 400000,
                    percentage: 8,
                    description: 'Elderly care, women welfare, child protection'
                },
                {
                    department: 'Administration',
                    amount: 300000,
                    percentage: 6,
                    description: 'Office expenses, staff salary, building maintenance'
                }
            ],
            isActive: true,
            approvalDate: new Date('2026-04-01')
        }
    ],

    // FAQs
    faqs: [
        {
            question: 'When should I pay house tax?',
            answer: 'House tax should be paid once a year for the period from April to March. Last date for tax payment is March 31. Late payment will attract penalty.',
            category: 'services',
            isActive: true
        },
        {
            question: 'How much is the charge for water connection?',
            answer: 'New water connection costs Rs.1500. This includes meter and pipe connection. Monthly water charge is Rs.100 (up to 5000 liters).',
            category: 'services',
            isActive: true
        },
        {
            question: 'How to get birth/death certificate?',
            answer: 'Apply at Panchayat office for birth/death certificate. Required documents: Hospital certificate, parents identity card, residence proof. Fee: Rs.50.',
            category: 'documents',
            isActive: true
        },
        {
            question: 'Where to submit grievance?',
            answer: 'Grievance can be submitted at Panchayat office or online. Grievance hours are every Tuesday and Thursday morning. Response within 15 days.',
            category: 'complaints',
            isActive: true
        },
        {
            question: 'How to join Self Help Group?',
            answer: 'Apply at Women Welfare Office to join Self Help Group. Age 18-59, village resident, monthly saving capacity required. Minimum monthly saving Rs.100.',
            category: 'schemes',
            isActive: true
        }
    ],

    // News
    news: [
        {
            title: 'Ganapathipalayam Received Smart Village Award',
            content: 'Ganapathipalayam Panchayat received first place in Tamil Nadu Government Smart Village initiative. This award was given for digital services, environmental protection, and modern administration.',
            category: 'announcement',
            isActive: true,
            publishDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            imageUrl: null
        },
        {
            title: 'New Ambulance Service Started',
            content: '24-hour free ambulance service has been started for Ganapathipalayam area. Call 108 for emergency services. Modern medical equipment equipped ambulance facility.',
            category: 'development',
            isActive: true,
            publishDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            imageUrl: null
        }
    ],

    // Community Events
    events: [
        {
            title: 'Free Medical Camp',
            description: 'Free medical camp will be held at Ganapathipalayam Panchayat premises. Free eye checkup, blood pressure, and sugar test. Everyone is welcome.',
            eventType: 'health_camp',
            eventDate: new Date('2026-01-15'),
            startTime: '09:00',
            endTime: '17:00',
            venue: 'Panchayat Community Hall, Ganapathipalayam',
            organizer: 'Ganapathipalayam Panchayat & Government Hospital',
            contactInfo: '+91 9876543210',
            isFree: true,
            registrationRequired: false,
            status: 'upcoming'
        },
        {
            title: 'Polio Vaccination Camp',
            description: 'Polio vaccination camp for children aged 0-5 years. All parents are requested to bring their children.',
            eventType: 'vaccination',
            eventDate: new Date('2026-01-20'),
            startTime: '08:00',
            endTime: '14:00',
            venue: 'Primary Health Center, Ganapathipalayam',
            organizer: 'Health Department, Tirupur District',
            contactInfo: '+91 9876543211',
            isFree: true,
            registrationRequired: false,
            status: 'upcoming'
        },
        {
            title: 'Pongal Cultural Program',
            description: 'Cultural programs on the occasion of Pongal festival. Folk dance, drama, song competitions. Prizes will be distributed.',
            eventType: 'cultural',
            eventDate: new Date('2026-01-14'),
            startTime: '18:00',
            endTime: '22:00',
            venue: 'Panchayat Ground, Ganapathipalayam',
            organizer: 'Ganapathipalayam Panchayat',
            contactInfo: '+91 9876543210',
            isFree: true,
            registrationRequired: true,
            maxParticipants: 200,
            status: 'upcoming'
        },
        {
            title: 'Village Sports Competition',
            description: 'Sports competitions like Kabaddi, Kho-kho, running, long jump. Everyone above 18 years can participate.',
            eventType: 'sports',
            eventDate: new Date('2026-01-25'),
            startTime: '07:00',
            endTime: '18:00',
            venue: 'Government Higher Secondary School Ground, Ganapathipalayam',
            organizer: 'Youth Association, Ganapathipalayam',
            contactInfo: '+91 9876543212',
            isFree: true,
            registrationRequired: true,
            maxParticipants: 100,
            status: 'upcoming'
        },
        {
            title: 'Computer Training Class',
            description: 'Free basic computer training for unemployed youth. Microsoft Office, Internet, Email training.',
            eventType: 'training',
            eventDate: new Date('2026-02-01'),
            startTime: '10:00',
            endTime: '16:00',
            venue: 'Panchayat Computer Center, Ganapathipalayam',
            organizer: 'District Employment Office',
            contactInfo: '+91 9876543213',
            isFree: true,
            registrationRequired: true,
            maxParticipants: 30,
            status: 'upcoming'
        }
    ],

    // Panchayat Works
    works: [
        {
            title: 'Road Tarring Work - Moolaiyar Street',
            description: 'Tar road laying in Moolaiyar Street 500 meters. Quality tar being used for durability.',
            workType: 'road',
            location: 'Moolaiyar Street, Ganapathipalayam',
            contractor: 'Tamil Nadu Road Construction Company',
            budgetAmount: 250000,
            startDate: new Date('2025-12-01'),
            expectedCompletion: new Date('2026-01-31'),
            progressPercentage: 75,
            status: 'in_progress'
        },
        {
            title: 'Water Pipe Installation - Anna Nagar',
            description: 'New drinking water pipe installation in Anna Nagar. 300 meters PVC pipe installation.',
            workType: 'water',
            location: 'Anna Nagar, Ganapathipalayam',
            contractor: 'District Water Supply Board',
            budgetAmount: 180000,
            startDate: new Date('2025-11-15'),
            expectedCompletion: new Date('2026-01-15'),
            progressPercentage: 60,
            status: 'in_progress'
        },
        {
            title: 'Drainage System - Perumal Kovil Street',
            description: 'Underground drainage system construction in Perumal Kovil Street to prevent water stagnation.',
            workType: 'drainage',
            location: 'Perumal Kovil Street, Ganapathipalayam',
            contractor: 'Local Construction Company',
            budgetAmount: 320000,
            startDate: new Date('2025-10-01'),
            expectedCompletion: new Date('2026-01-10'),
            progressPercentage: 90,
            status: 'in_progress'
        },
        {
            title: 'LED Street Lights Installation',
            description: '50 new LED street lights installation in all streets. Energy efficient and bright lights.',
            workType: 'electricity',
            location: 'All Streets, Ganapathipalayam',
            contractor: 'Tamil Nadu Electricity Board',
            budgetAmount: 150000,
            startDate: new Date('2026-02-01'),
            expectedCompletion: new Date('2026-03-15'),
            progressPercentage: 0,
            status: 'planned'
        },
        {
            title: 'Children Playground',
            description: 'New playground for children with swings, slides, and seesaws.',
            workType: 'park',
            location: 'Panchayat Ground, Ganapathipalayam',
            contractor: 'Local Works Department',
            budgetAmount: 200000,
            startDate: new Date('2026-02-15'),
            expectedCompletion: new Date('2026-04-30'),
            progressPercentage: 0,
            status: 'planned'
        },
        {
            title: 'Public Toilet Construction',
            description: 'Modern public toilet construction near bus stand. Separate facilities for men and women.',
            workType: 'sanitation',
            location: 'Bus Stand, Ganapathipalayam',
            contractor: 'Swachh Bharat Mission',
            budgetAmount: 280000,
            startDate: new Date('2025-08-01'),
            expectedCompletion: new Date('2025-12-31'),
            progressPercentage: 100,
            status: 'completed'
        }
    ],

    // Public Suggestions
    suggestions: [
        {
            title: 'Install speed breaker near school',
            description: 'Vehicles are speeding near the school. Request to install speed breaker for children safety.',
            category: 'infrastructure',
            status: 'under_review',
            upvotes: 45
        },
        {
            title: 'Tree planting program',
            description: 'Request to plant trees on both sides of the main road. This will provide shade and improve air quality.',
            category: 'environment',
            status: 'approved',
            upvotes: 78
        },
        {
            title: 'Evening study room needed',
            description: 'Need a study room for students to study in the evening. Many houses do not have proper facilities.',
            category: 'education',
            status: 'approved',
            upvotes: 120
        },
        {
            title: 'Health worker appointment',
            description: 'Need to appoint a full-time health worker at the Primary Health Center for better service.',
            category: 'health',
            status: 'under_review',
            upvotes: 35
        },
        {
            title: 'Doctor needed at Primary Health Center',
            description: 'Currently there is no regular doctor at PHC. Request to appoint a full-time doctor.',
            category: 'health',
            status: 'approved',
            upvotes: 92
        },
        {
            title: 'Shade at bus stop',
            description: 'No shade at the main bus stop. People suffer in sun and rain. Request to build a shelter.',
            category: 'infrastructure',
            status: 'under_review',
            upvotes: 67
        }
    ],

    // Emergency Alerts
    alerts: [
        {
            title: 'Drinking Water Supply Disruption',
            content: 'Due to pipe repair work, drinking water supply will be disrupted on January 8 and 9. Please store water for emergency use.',
            alertType: 'water_contamination',
            severity: 'medium',
            isActive: true,
            expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            affectedAreas: ['Anna Nagar', 'Moolaiyar Street', 'Bus Stand Area'],
            instructions: ['Store water in clean containers', 'Use boiled water for drinking', 'Contact Panchayat for emergency water supply']
        },
        {
            title: 'Heavy Rain Warning',
            content: 'Meteorological Department has issued heavy rain warning for the next 3 days. Avoid unnecessary travel.',
            alertType: 'weather',
            severity: 'high',
            isActive: true,
            expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            affectedAreas: ['Entire Ganapathipalayam'],
            instructions: ['Stay indoors', 'Avoid low-lying areas', 'Keep emergency numbers ready', 'Do not cross flooded roads']
        },
        {
            title: 'Power Outage Notice',
            content: 'Planned power outage on January 10 from 10 AM to 4 PM for electrical maintenance work.',
            alertType: 'power_outage',
            severity: 'low',
            isActive: true,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            affectedAreas: ['Ward 1', 'Ward 2', 'Ward 3'],
            instructions: ['Charge mobile phones beforehand', 'Avoid using elevators during outage']
        },
        {
            title: 'Dengue Prevention Awareness',
            content: 'Dengue cases are increasing in surrounding areas. Please keep your surroundings clean and remove stagnant water.',
            alertType: 'health',
            severity: 'medium',
            isActive: true,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            affectedAreas: ['Entire Ganapathipalayam'],
            instructions: ['Remove stagnant water', 'Use mosquito nets', 'Wear full sleeve clothes', 'Use mosquito repellents', 'Seek medical help for fever']
        }
    ],

    // Additional news items
    additionalNews: [
        {
            title: 'Pongal Holiday Announcement',
            content: 'Panchayat office will remain closed from January 14 to 16 for Pongal festival. Emergency services will be available.',
            category: 'announcement',
            isActive: true
        },
        {
            title: 'Free Computer Training',
            content: 'Free basic computer training program starting from February 1. Registration open at Panchayat office. Limited seats available.',
            category: 'development',
            isActive: true
        },
        {
            title: 'New Water Connection Application',
            content: 'Applications are being accepted for new water connections. Submit application with required documents at Panchayat office.',
            category: 'announcement',
            isActive: true
        },
        {
            title: 'Sports Competition Announcement',
            content: 'Annual village sports competition will be held on January 25. Registration deadline: January 20. Prizes worth Rs.50,000.',
            category: 'event',
            isActive: true
        }
    ],

    // Additional budget entries for different years
    additionalBudgets: [
        // 2026-27 (Current Year)
        { department: 'Water Supply', amount: 1500000, spent: 200000, year: '2026', description: 'New water connections and pipe repairs' },
        { department: 'Road Development', amount: 1200000, spent: 350000, year: '2026', description: 'Road tarring and maintenance' },
        { department: 'Education', amount: 900000, spent: 100000, year: '2026', description: 'School improvements and scholarships' },
        { department: 'Health', amount: 800000, spent: 150000, year: '2026', description: 'PHC upgrades and medical camps' },
        { department: 'Environment', amount: 700000, spent: 50000, year: '2026', description: 'Waste management and tree planting' },
        { department: 'Social Welfare', amount: 500000, spent: 75000, year: '2026', description: 'Pension schemes and welfare programs' },
        { department: 'Administration', amount: 400000, spent: 120000, year: '2026', description: 'Office expenses and salaries' },
        { department: 'Sports Facilities', amount: 350000, spent: 0, year: '2026', description: 'Playground and sports equipment' },
        { department: 'Housing', amount: 600000, spent: 80000, year: '2026', description: 'PMAY-G housing assistance' },
        // 2025-26
        { department: 'Sports Facilities', amount: 300000, spent: 280000, year: '2025', description: 'Playground renovation' },
        { department: 'Housing', amount: 500000, spent: 450000, year: '2025', description: 'Housing scheme implementation' },
        // 2024-25
        { department: 'Water Supply', amount: 1000000, spent: 950000, year: '2024', description: 'Water tank construction' },
        { department: 'Road Development', amount: 800000, spent: 780000, year: '2024', description: 'Main road repair' },
        { department: 'Education', amount: 600000, spent: 580000, year: '2024', description: 'School building renovation' },
        { department: 'Health', amount: 500000, spent: 490000, year: '2024', description: 'PHC equipment purchase' },
        // 2023-24
        { department: 'Water Supply', amount: 900000, spent: 880000, year: '2023', description: 'Pipeline extension' },
        { department: 'Road Development', amount: 700000, spent: 690000, year: '2023', description: 'Street repair work' },
        { department: 'Education', amount: 500000, spent: 480000, year: '2023', description: 'Library setup' }
    ],

    // Sample complaints
    complaints: [
        {
            title: 'Road Damage in Perumal Kovil Street',
            description: 'The road in Perumal Kovil Street has many potholes. Difficult for vehicles and pedestrians. Please repair urgently.',
            category: 'Road & Infrastructure',
            priority: 'high',
            location: 'Perumal Kovil Street, Ganapathipalayam',
            status: 'in_progress'
        },
        {
            title: 'Water Pipe Leakage - Anna Nagar',
            description: 'Water is leaking from the main pipe in Anna Nagar for the past 3 days. Lots of water wastage. Please fix immediately.',
            category: 'Water Supply',
            priority: 'high',
            location: 'Anna Nagar, Ganapathipalayam',
            status: 'pending'
        },
        {
            title: 'Street Lights Not Working',
            description: 'Street lights in Moolaiyar Street are not working for a week. Very dark at night and safety concern.',
            category: 'Street Lights',
            priority: 'normal',
            location: 'Moolaiyar Street, Ganapathipalayam',
            status: 'resolved'
        }
    ]
};

// Insert mock data
const insertMockData = async () => {
    await connectDB();
    
    try {
        console.log('🧹 Clearing existing data...');
        
        // Clear existing data
        await User.deleteMany({});
        await Announcement.deleteMany({});
        await Complaint.deleteMany({});
        await ComplaintHistory.deleteMany({});
        await GramSabhaMeeting.deleteMany({});
        await Poll.deleteMany({});
        await PollOption.deleteMany({});
        await PollVote.deleteMany({});
        await GovernmentScheme.deleteMany({});
        await BudgetEntry.deleteMany({});
        await BudgetCategory.deleteMany({});
        await FAQ.deleteMany({});
        await NewsUpdate.deleteMany({});
        await CommunityEvent.deleteMany({});
        await PanchayatWork.deleteMany({});
        await PublicSuggestion.deleteMany({});
        await SuggestionUpvote.deleteMany({});
        await EmergencyAlert.deleteMany({});
        
        console.log('👥 Inserting users...');
        
        // Insert users
        const createdUsers = [];
        for (let userData of mockData.users) {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const user = new User({
                name: userData.name,
                email: userData.email,
                password: hashedPassword,
                phone: userData.phone,
                address: userData.address,
                role: userData.role,
                isApproved: userData.isApproved,
                approvalDate: userData.approvalDate,
                firebaseUid: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            });
            await user.save();
            createdUsers.push(user);
            console.log(`✅ User created: ${userData.name} (${userData.role})`);
        }
        
        const adminUser = createdUsers.find(u => u.role === 'admin');
        const citizenUsers = createdUsers.filter(u => u.role === 'citizen');
        
        console.log('📢 Inserting announcements...');
        
        // Insert announcements
        for (let announcement of mockData.announcements) {
            const newAnnouncement = new Announcement({
                title: announcement.title,
                content: announcement.content,
                category: announcement.category,
                priority: announcement.priority,
                isActive: announcement.isActive,
                publishDate: announcement.publishDate,
                expiryDate: announcement.expiryDate,
                createdBy: adminUser._id.toString()
            });
            await newAnnouncement.save();
            console.log(`✅ Announcement created: ${announcement.title}`);
        }

        console.log('🤝 Inserting meetings...');
        
        // Insert meetings
        for (let meetingData of mockData.meetings) {
            const meeting = new GramSabhaMeeting({
                title: meetingData.title,
                description: meetingData.description,
                meetingDate: meetingData.date,
                meetingTime: meetingData.time,
                venue: meetingData.venue,
                agenda: Array.isArray(meetingData.agenda) ? meetingData.agenda.join('\n') : meetingData.agenda,
                status: 'upcoming',
                createdBy: adminUser._id.toString()
            });
            await meeting.save();
            console.log(`✅ Meeting created: ${meetingData.title}`);
        }

        console.log('🗳️ Inserting polls...');
        
        // Insert polls
        for (let pollData of mockData.polls) {
            const poll = new Poll({
                question: pollData.title,
                description: pollData.description,
                startsAt: new Date(),
                endsAt: pollData.endDate,
                allowMultiple: pollData.allowMultiple,
                status: 'active',
                createdBy: adminUser._id.toString()
            });
            await poll.save();
            
            // Create poll options
            for (let i = 0; i < pollData.options.length; i++) {
                const option = new PollOption({
                    pollId: poll._id,
                    optionText: pollData.options[i],
                    voteCount: Math.floor(Math.random() * 50)
                });
                await option.save();
            }
            console.log(`✅ Poll created: ${pollData.title}`);
        }

        console.log('🏠 Inserting schemes...');
        
        // Insert schemes
        for (let schemeData of mockData.schemes) {
            const scheme = new GovernmentScheme({
                name: schemeData.title,
                description: schemeData.description,
                category: schemeData.category,
                eligibility: Array.isArray(schemeData.eligibilityCriteria) ? schemeData.eligibilityCriteria.join('\n') : schemeData.eligibilityCriteria,
                benefits: Array.isArray(schemeData.benefits) ? schemeData.benefits.join('\n') : schemeData.benefits,
                documentsRequired: Array.isArray(schemeData.requiredDocuments) ? schemeData.requiredDocuments.join('\n') : schemeData.requiredDocuments,
                lastDate: schemeData.endDate,
                isActive: schemeData.isActive,
                createdBy: adminUser._id.toString()
            });
            await scheme.save();
            console.log(`✅ Scheme created: ${schemeData.title}`);
        }

        console.log('💰 Inserting budget categories and entries...');
        
        // Insert budget categories and entries
        for (let allocation of mockData.budgets[0].allocations) {
            // Create category
            let category = await BudgetCategory.findOne({ name: allocation.department });
            if (!category) {
                category = new BudgetCategory({
                    name: allocation.department,
                    icon: 'category',
                    color: '#007bff'
                });
                await category.save();
            }
            
            // Create budget entry
            const budgetEntry = new BudgetEntry({
                categoryId: category._id,
                fiscalYear: '2025',
                allocatedAmount: allocation.amount,
                spentAmount: Math.floor(allocation.amount * 0.3),
                description: allocation.description,
                createdBy: adminUser._id.toString()
            });
            await budgetEntry.save();
            console.log(`✅ Budget entry created: ${allocation.department} - ₹${allocation.amount}`);
        }

        console.log('❓ Inserting FAQs...');
        
        // Insert FAQs
        for (let faqData of mockData.faqs) {
            const faq = new FAQ({
                question: faqData.question,
                answer: faqData.answer,
                category: faqData.category,
                isActive: faqData.isActive,
                createdBy: adminUser._id.toString()
            });
            await faq.save();
            console.log(`✅ FAQ created: ${faqData.question.substring(0, 50)}...`);
        }

        console.log('📰 Inserting news...');
        
        // Insert news
        for (let newsData of mockData.news) {
            const news = new NewsUpdate({
                title: newsData.title,
                content: newsData.content,
                category: newsData.category,
                isPublished: newsData.isActive !== false,
                publishedAt: new Date(),
                createdBy: adminUser._id.toString()
            });
            await news.save();
            console.log(`✅ News created: ${newsData.title}`);
        }

        console.log('🎪 Inserting events...');
        
        // Insert events
        for (let eventData of mockData.events) {
            const event = new CommunityEvent({
                title: eventData.title,
                description: eventData.description,
                eventType: eventData.eventType,
                eventDate: eventData.eventDate,
                startTime: eventData.startTime,
                endTime: eventData.endTime,
                endDate: eventData.endDate,
                venue: eventData.venue,
                organizer: eventData.organizer,
                contactInfo: eventData.contactInfo,
                isFree: eventData.isFree,
                registrationRequired: eventData.registrationRequired,
                maxParticipants: eventData.maxParticipants,
                status: eventData.status,
                createdBy: adminUser._id.toString()
            });
            await event.save();
            console.log(`✅ Event created: ${eventData.title}`);
        }

        console.log('🏗️ Inserting panchayat works...');
        
        // Insert works
        for (let workData of mockData.works) {
            const work = new PanchayatWork({
                title: workData.title,
                description: workData.description,
                workType: workData.workType,
                location: workData.location,
                contractor: workData.contractor,
                budgetAmount: workData.budgetAmount,
                startDate: workData.startDate,
                expectedCompletion: workData.expectedCompletion,
                progressPercentage: workData.progressPercentage,
                status: workData.status,
                createdBy: adminUser._id.toString()
            });
            await work.save();
            console.log(`✅ Work created: ${workData.title}`);
        }

        console.log('💡 Inserting suggestions...');
        
        // Insert suggestions
        for (let i = 0; i < mockData.suggestions.length; i++) {
            const suggestionData = mockData.suggestions[i];
            const randomUser = citizenUsers[i % citizenUsers.length];
            const suggestion = new PublicSuggestion({
                title: suggestionData.title,
                description: suggestionData.description,
                category: suggestionData.category,
                status: suggestionData.status,
                upvotes: suggestionData.upvotes,
                userId: randomUser._id.toString()
            });
            await suggestion.save();
            console.log(`✅ Suggestion created: ${suggestionData.title.substring(0, 50)}...`);
        }

        console.log('🚨 Inserting emergency alerts...');
        
        // Insert alerts
        for (let alertData of mockData.alerts) {
            const alert = new EmergencyAlert({
                title: alertData.title,
                message: alertData.content,
                alertType: alertData.alertType,
                severity: alertData.severity,
                isActive: alertData.isActive,
                expiresAt: alertData.expiresAt,
                affectedAreas: Array.isArray(alertData.affectedAreas) ? alertData.affectedAreas.join(', ') : alertData.affectedAreas,
                instructions: Array.isArray(alertData.instructions) ? alertData.instructions.join('\n') : alertData.instructions,
                createdBy: adminUser._id.toString()
            });
            await alert.save();
            console.log(`✅ Alert created: ${alertData.title}`);
        }

        console.log('📰 Inserting additional news...');
        
        // Insert additional news
        for (let newsData of mockData.additionalNews) {
            const news = new NewsUpdate({
                title: newsData.title,
                content: newsData.content,
                category: newsData.category,
                isPublished: newsData.isActive !== false,
                publishedAt: new Date(),
                createdBy: adminUser._id.toString()
            });
            await news.save();
            console.log(`✅ News created: ${newsData.title}`);
        }

        console.log('💰 Inserting additional budget entries...');
        
        // Insert additional budget entries for past years
        for (let budgetData of mockData.additionalBudgets) {
            // Find or create category
            let category = await BudgetCategory.findOne({ name: budgetData.department });
            if (!category) {
                category = new BudgetCategory({
                    name: budgetData.department,
                    icon: 'category',
                    color: '#007bff'
                });
                await category.save();
            }
            
            const budgetEntry = new BudgetEntry({
                categoryId: category._id,
                fiscalYear: budgetData.year,
                allocatedAmount: budgetData.amount,
                spentAmount: budgetData.spent,
                description: budgetData.description,
                createdBy: adminUser._id.toString()
            });
            await budgetEntry.save();
            console.log(`✅ Budget entry created: ${budgetData.department} (${budgetData.year}) - ₹${budgetData.amount}`);
        }

        console.log('📝 Inserting sample complaints...');
        
        // Insert sample complaints
        for (let i = 0; i < mockData.complaints.length; i++) {
            const complaintData = mockData.complaints[i];
            const randomUser = citizenUsers[i % citizenUsers.length];
            
            const complaint = new Complaint({
                title: complaintData.title,
                description: complaintData.description,
                category: complaintData.category,
                priority: complaintData.priority,
                location: complaintData.location,
                status: complaintData.status,
                userId: randomUser._id.toString(),
                trackingId: `GNP${Date.now().toString().slice(-6)}${Math.random().toString(36).substr(2, 4).toUpperCase()}`
            });
            await complaint.save();
            
            // Add to complaint history
            const history = new ComplaintHistory({
                complaintId: complaint._id,
                status: complaintData.status,
                remarks: 'Complaint registered successfully',
                updatedBy: adminUser._id.toString()
            });
            await history.save();
            
            console.log(`✅ Complaint created: ${complaintData.title}`);
        }

        console.log('\n🎉 Mock data insertion completed successfully!');
        console.log('\n📊 Data Summary:');
        console.log(`👥 Users: ${await User.countDocuments()}`);
        console.log(`📢 Announcements: ${await Announcement.countDocuments()}`);
        console.log(`📝 Complaints: ${await Complaint.countDocuments()}`);
        console.log(`🤝 Meetings: ${await GramSabhaMeeting.countDocuments()}`);
        console.log(`🗳️ Polls: ${await Poll.countDocuments()}`);
        console.log(`📰 News: ${await NewsUpdate.countDocuments()}`);
        console.log(`🚨 Alerts: ${await EmergencyAlert.countDocuments()}`);
        console.log(`🏠 Schemes: ${await GovernmentScheme.countDocuments()}`);
        console.log(`💰 Budget Entries: ${await BudgetEntry.countDocuments()}`);
        console.log(`❓ FAQs: ${await FAQ.countDocuments()}`);
        console.log(`🎪 Events: ${await CommunityEvent.countDocuments()}`);
        console.log(`🏗️ Works: ${await PanchayatWork.countDocuments()}`);
        console.log(`💡 Suggestions: ${await PublicSuggestion.countDocuments()}`);
        
        console.log('\n🔐 Admin Login Credentials:');
        console.log('Email: president@ganapathipalayam.tn.gov.in');
        console.log('Password: admin123');
        
        console.log('\n👤 Citizen Login Example:');
        console.log('Email: velu.murugan@gmail.com');
        console.log('Password: citizen123');
        
    } catch (error) {
        console.error('❌ Error inserting mock data:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
        process.exit(0);
    }
};

// Run the script
insertMockData();
