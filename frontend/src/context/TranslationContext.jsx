import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import translateService from '../services/translateService';

const TranslationContext = createContext();

// Static translations for common UI elements (pre-translated to reduce API calls)
const STATIC_TRANSLATIONS = {
  en: {
    // Navigation
    home: 'Home',
    about: 'About',
    services: 'Services',
    contact: 'Contact',
    fileComplaint: 'File Complaint',
    myComplaints: 'My Complaints',
    announcements: 'Announcements',
    profile: 'Profile',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    dashboard: 'Dashboard',
    // Common
    welcome: 'Welcome',
    loading: 'Loading...',
    submit: 'Submit',
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    search: 'Search',
    filter: 'Filter',
    status: 'Status',
    date: 'Date',
    description: 'Description',
    category: 'Category',
    priority: 'Priority',
    viewAll: 'View All',
    viewDetails: 'View Details',
    viewMore: 'View More',
    learnMore: 'Learn More',
    readMore: 'Read More',
    seeAll: 'See All',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    close: 'Close',
    apply: 'Apply',
    confirm: 'Confirm',
    // Panchayat
    panchayatName: 'Ganapathipalayam Panchayat',
    slogan: 'Together We Build Our Village',
    address: '2/783(41, Moogambigai Nagar, Ganapathipalayam, Palladam, Tamil Nadu 641605',
    portalSubtitle: 'Palladam Taluka, Tiruppur District - Official NamSev Portal',
    citizenPortal: 'Citizen Portal',
    governmentOfTamilNadu: 'Government of Tamil Nadu',
    // Sections
    latestNews: 'Latest News',
    moreNews: 'More News',
    newsDescription: 'Stay updated with the latest announcements',
    eventTypes: 'Event Types',
    eventTypesDesc: 'Upcoming Panchayat events and programs',
    panchayatCouncil: 'Panchayat Council',
    panchayatCouncilDesc: 'Contact elected representatives',
    documents: 'Documents',
    documentsDesc: 'Download forms and certificates',
    namSevPortal: 'NamSev Portal',
    namSevPortalDesc: 'Get started with the portal',
    howToRegister: 'How to Register',
    trackStatus: 'Track Status',
    contactUs: 'Contact Us',
    villagePlaces: 'Village Places',
    galleries: 'Galleries',
    latestDocuments: 'Latest Documents',
    // Stats
    totalComplaints: 'Total Complaints',
    resolvedComplaints: 'Resolved',
    pendingComplaints: 'Pending',
    registeredCitizens: 'Registered Citizens',
    // Footer
    officialPortal: 'Official Civic Engagement Portal',
    quickLinks: 'Quick Links',
    contactInfo: 'Contact Info',
    allRightsReserved: 'All Rights Reserved',
    poweredBy: 'Powered by NamSev Platform',
    // Complaint Status
    pending: 'Pending',
    inProgress: 'In Progress',
    resolved: 'Resolved',
    rejected: 'Rejected',
    // Messages
    noData: 'No data available',
    error: 'An error occurred',
    success: 'Success',
    noDataFound: 'No data found',
    noResults: 'No results found',
    tryAgain: 'Try again',
    // Hero Section
    heroTitle: 'Connecting Citizens with Local Governance',
    heroSubtitle: 'Empowering our village through transparent governance, citizen participation, and digital innovation. Join us in building a better tomorrow for our community.',
    getStarted: 'Get Started',
    watchTour: 'Watch Tour',
    scrollDown: 'Scroll Down',
    // Pages
    gramSabha: 'Gram Sabha',
    schemes: 'Schemes',
    events: 'Events',
    works: 'Works',
    polls: 'Polls',
    faqs: 'FAQs',
    news: 'News',
    meetings: 'Meetings',
    budget: 'Budget',
    suggestions: 'Suggestions',
    // Page Titles
    upcomingMeetings: 'Upcoming Meetings',
    upcomingEvents: 'Our Upcoming Events',
    governmentSchemes: 'Government Schemes',
    communityPolls: 'Community Polls',
    publicWorks: 'Public Works',
    frequentlyAskedQuestions: 'Frequently Asked Questions',
    // Page Subtitles
    participateInGovernance: 'Participate in local governance and make your voice heard',
    joinCommunityEvents: 'Join community events and programs organized by the Panchayat',
    exploreSchemes: 'Explore government schemes and benefits available for citizens',
    yourVoiceMatters: 'Your Voice Matters',
    shareOpinion: 'Share your opinion and help shape our community\'s future',
    findAnswers: 'Find answers to common questions about Panchayat services',
    searchQuestions: 'Search for questions...',
    // Events
    upcoming: 'Upcoming',
    free: 'Free',
    rsvpNow: 'RSVP Now',
    attending: 'Attending',
    notAttending: 'Not Attending',
    viewEvent: 'View Event',
    // Polls
    vote: 'Vote',
    votes: 'votes',
    changeVote: 'Change Vote',
    voteRecorded: 'Vote recorded successfully!',
    voteChanged: 'Vote changed successfully!',
    loginToVote: 'Please login to vote',
    // Works
    progress: 'Progress',
    completed: 'Completed',
    planned: 'Planned',
    delayed: 'Delayed',
    estimatedCost: 'Estimated Cost',
    startDate: 'Start Date',
    endDate: 'End Date',
    contractor: 'Contractor',
    // Schemes
    eligibility: 'Eligibility',
    benefits: 'Benefits',
    applyNow: 'Apply Now',
    deadline: 'Deadline',
    open: 'Open',
    // Meetings
    attendees: 'Attendees',
    venue: 'Venue',
    agenda: 'Agenda',
    willAttend: 'Will Attend',
    cantAttend: "Can't Attend",
    // Forms
    emailAddress: 'Email Address',
    password: 'Password',
    fullName: 'Full Name',
    phoneNumber: 'Phone Number',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    forgotPassword: 'Forgot Password?',
    createAccount: 'Create Account',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    enterEmail: 'Enter your email',
    enterPassword: 'Enter your password',
    // Complaint Form
    issueTitle: 'Issue Title',
    selectCategory: 'Select a category',
    location: 'Location',
    detailedDescription: 'Detailed Description',
    attachments: 'Attachments',
    submitComplaint: 'Submit Complaint',
    trackingId: 'Tracking ID',
    // Profile
    panchayatResident: 'Panchayat Resident',
    editProfile: 'Edit Profile',
    updateProfile: 'Update Profile',
    profileUpdated: 'Profile updated successfully',
    memberSince: 'Member Since',
    // Alerts
    alert: 'Alert',
    emergency: 'Emergency',
    important: 'Important',
    notice: 'Notice',
    // Budget
    totalBudget: 'Total Budget',
    allocated: 'Allocated',
    spent: 'Spent',
    remaining: 'Remaining',
    fiscalYear: 'Fiscal Year',
    // Profile & Forms
    saveChanges: 'Save Changes',
    addressField: 'Address',
    // Meetings Page
    gramSabhaMeetings: 'Gram Sabha Meetings',
    stayInformedMeetings: 'Stay informed about public meetings and participate in local governance',
    // Suggestions Page
    communitySuggestions: 'Community Suggestions',
    shareIdeasForDevelopment: 'Share your ideas for village development and improvement',
    addSuggestion: 'Add Suggestion',
    newSuggestion: 'New Suggestion',
    // Budget Page
    budgetOverview: 'Budget Overview',
    transparencyInSpending: 'Transparency in public spending - See how your tax money is being utilized',
    amountSpent: 'Amount Spent',
    utilized: 'utilized',
    available: 'available',
    overallUtilization: 'Overall Utilization',
    budgetSpent: 'Budget Spent',
    categoryWiseAllocation: 'Category-wise Allocation',
    // Filter Labels
    all: 'All',
    urgent: 'Urgent',
    high: 'High',
    normal: 'Normal',
    low: 'Low',
    // Status
    underReview: 'Under Review',
    approved: 'Approved',
    implemented: 'Implemented',
    // Announcements
    stayUpdatedAnnouncements: 'Stay updated with the latest news and announcements',
    noAnnouncementsAvailable: 'No announcements available',
    // Common Actions
    upvote: 'Upvote',
    thanksForVote: 'Thanks for your vote!',
    voteRemoved: 'Vote removed'
  },
  ta: {
    // Navigation
    home: 'முகப்பு',
    about: 'எங்களைப் பற்றி',
    services: 'சேவைகள்',
    contact: 'தொடர்பு',
    fileComplaint: 'புகார் பதிவு செய்',
    myComplaints: 'என் புகார்கள்',
    announcements: 'அறிவிப்புகள்',
    profile: 'சுயவிவரம்',
    login: 'உள்நுழைவு',
    register: 'பதிவு',
    logout: 'வெளியேறு',
    dashboard: 'டாஷ்போர்ட்',
    // Common
    welcome: 'வரவேற்பு',
    loading: 'ஏற்றுகிறது...',
    submit: 'சமர்ப்பிக்க',
    cancel: 'ரத்து செய்',
    save: 'சேமி',
    edit: 'திருத்து',
    delete: 'நீக்கு',
    search: 'தேடு',
    filter: 'வடிகட்டு',
    status: 'நிலை',
    date: 'தேதி',
    description: 'விளக்கம்',
    category: 'வகை',
    priority: 'முன்னுரிமை',
    viewAll: 'அனைத்தும் காண்க',
    viewDetails: 'விவரங்கள் காண்க',
    viewMore: 'மேலும் காண்க',
    learnMore: 'மேலும் அறிக',
    readMore: 'மேலும் படிக்க',
    seeAll: 'அனைத்தும் பார்க்க',
    back: 'பின்',
    next: 'அடுத்து',
    previous: 'முந்தைய',
    close: 'மூடு',
    apply: 'விண்ணப்பிக்க',
    confirm: 'உறுதிப்படுத்து',
    // Panchayat
    panchayatName: 'கணபதிபாளையம் ஊராட்சி',
    slogan: 'ஒன்றாக நம் கிராமத்தை உருவாக்குவோம்',
    address: '2/783(41, மூகாம்பிகை நகர், கணபதிபாளையம், பல்லடம், தமிழ்நாடு 641605',
    portalSubtitle: 'பல்லடம் வட்டம், திருப்பூர் மாவட்டம் - அதிகாரப்பூர்வ நாம்சேவ் போர்டல்',
    citizenPortal: 'குடிமக்கள் போர்டல்',
    governmentOfTamilNadu: 'தமிழ்நாடு அரசு',
    // Sections
    latestNews: 'சமீபத்திய செய்திகள்',
    moreNews: 'மேலும் செய்திகள்',
    newsDescription: 'சமீபத்திய அறிவிப்புகளுடன் புதுப்பித்த நிலையில் இருங்கள்',
    eventTypes: 'நிகழ்வு வகைகள்',
    eventTypesDesc: 'வரவிருக்கும் ஊராட்சி நிகழ்வுகள் மற்றும் திட்டங்கள்',
    panchayatCouncil: 'ஊராட்சி சபை',
    panchayatCouncilDesc: 'தேர்ந்தெடுக்கப்பட்ட பிரதிநிதிகளை தொடர்பு கொள்ளவும்',
    documents: 'ஆவணங்கள்',
    documentsDesc: 'படிவங்கள் மற்றும் சான்றிதழ்களை பதிவிறக்கம் செய்யவும்',
    namSevPortal: 'நாம்சேவ் போர்டல்',
    namSevPortalDesc: 'போர்டலுடன் தொடங்குங்கள்',
    howToRegister: 'பதிவு செய்வது எப்படி',
    trackStatus: 'நிலையை கண்காணிக்கவும்',
    contactUs: 'எங்களை தொடர்பு கொள்ளவும்',
    villagePlaces: 'கிராம இடங்கள்',
    galleries: 'படத்தொகுப்புகள்',
    latestDocuments: 'சமீபத்திய ஆவணங்கள்',
    // Stats
    totalComplaints: 'மொத்த புகார்கள்',
    resolvedComplaints: 'தீர்க்கப்பட்டவை',
    pendingComplaints: 'நிலுவையில் உள்ளவை',
    registeredCitizens: 'பதிவு செய்த குடிமக்கள்',
    // Footer
    officialPortal: 'அதிகாரப்பூர்வ குடிமை ஈடுபாடு போர்டல்',
    quickLinks: 'விரைவு இணைப்புகள்',
    contactInfo: 'தொடர்பு தகவல்',
    allRightsReserved: 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை',
    poweredBy: 'நாம்சேவ் தளத்தால் இயக்கப்படுகிறது',
    // Complaint Status
    pending: 'நிலுவையில்',
    inProgress: 'நடைபெறுகிறது',
    resolved: 'தீர்க்கப்பட்டது',
    rejected: 'நிராகரிக்கப்பட்டது',
    // Messages
    noData: 'தரவு இல்லை',
    error: 'பிழை ஏற்பட்டது',
    success: 'வெற்றி',
    noDataFound: 'தரவு கிடைக்கவில்லை',
    noResults: 'முடிவுகள் இல்லை',
    tryAgain: 'மீண்டும் முயற்சிக்கவும்',
    // Hero Section
    heroTitle: 'குடிமக்களை உள்ளாட்சியுடன் இணைக்கிறோம்',
    heroSubtitle: 'வெளிப்படையான நிர்வாகம், குடிமக்கள் பங்கேற்பு மற்றும் டிஜிட்டல் புதுமை மூலம் நம் கிராமத்தை மேம்படுத்துகிறோம்.',
    getStarted: 'தொடங்குங்கள்',
    watchTour: 'சுற்றுப்பயணம் பாருங்கள்',
    scrollDown: 'கீழே உருட்டவும்',
    // Pages
    gramSabha: 'கிராம சபை',
    schemes: 'திட்டங்கள்',
    events: 'நிகழ்வுகள்',
    works: 'பணிகள்',
    polls: 'வாக்கெடுப்புகள்',
    faqs: 'அடிக்கடி கேட்கப்படும் கேள்விகள்',
    news: 'செய்திகள்',
    meetings: 'கூட்டங்கள்',
    budget: 'பட்ஜெட்',
    suggestions: 'பரிந்துரைகள்',
    // Page Titles
    upcomingMeetings: 'வரவிருக்கும் கூட்டங்கள்',
    upcomingEvents: 'வரவிருக்கும் நிகழ்வுகள்',
    governmentSchemes: 'அரசு திட்டங்கள்',
    communityPolls: 'சமூக வாக்கெடுப்புகள்',
    publicWorks: 'பொதுப் பணிகள்',
    frequentlyAskedQuestions: 'அடிக்கடி கேட்கப்படும் கேள்விகள்',
    // Page Subtitles
    participateInGovernance: 'உள்ளாட்சியில் பங்கேற்று உங்கள் குரலை எழுப்புங்கள்',
    joinCommunityEvents: 'ஊராட்சி நடத்தும் சமூக நிகழ்வுகளில் இணையுங்கள்',
    exploreSchemes: 'குடிமக்களுக்கு கிடைக்கும் அரசு திட்டங்களை ஆராயுங்கள்',
    yourVoiceMatters: 'உங்கள் குரல் முக்கியம்',
    shareOpinion: 'உங்கள் கருத்தைப் பகிர்ந்து சமூகத்தின் எதிர்காலத்தை வடிவமைக்க உதவுங்கள்',
    findAnswers: 'ஊராட்சி சேவைகள் பற்றிய பொதுவான கேள்விகளுக்கு பதில்களைக் கண்டறியுங்கள்',
    searchQuestions: 'கேள்விகளைத் தேடுங்கள்...',
    // Events
    upcoming: 'வரவிருக்கும்',
    free: 'இலவசம்',
    rsvpNow: 'இப்போதே பதிவு செய்யுங்கள்',
    attending: 'கலந்துகொள்கிறேன்',
    notAttending: 'கலந்துகொள்ள முடியாது',
    viewEvent: 'நிகழ்வைக் காண்க',
    // Polls
    vote: 'வாக்களி',
    votes: 'வாக்குகள்',
    changeVote: 'வாக்கை மாற்று',
    voteRecorded: 'வாக்கு பதிவு செய்யப்பட்டது!',
    voteChanged: 'வாக்கு மாற்றப்பட்டது!',
    loginToVote: 'வாக்களிக்க உள்நுழையவும்',
    // Works
    progress: 'முன்னேற்றம்',
    completed: 'நிறைவடைந்தது',
    planned: 'திட்டமிடப்பட்டது',
    delayed: 'தாமதமானது',
    estimatedCost: 'மதிப்பிடப்பட்ட செலவு',
    startDate: 'தொடக்க தேதி',
    endDate: 'முடிவு தேதி',
    contractor: 'ஒப்பந்தக்காரர்',
    // Schemes
    eligibility: 'தகுதி',
    benefits: 'நன்மைகள்',
    applyNow: 'இப்போதே விண்ணப்பிக்கவும்',
    deadline: 'கடைசி நாள்',
    open: 'திறந்தது',
    // Meetings
    attendees: 'பங்கேற்பாளர்கள்',
    venue: 'இடம்',
    agenda: 'நிகழ்ச்சி நிரல்',
    willAttend: 'கலந்துகொள்வேன்',
    cantAttend: 'கலந்துகொள்ள முடியாது',
    // Forms
    emailAddress: 'மின்னஞ்சல் முகவரி',
    password: 'கடவுச்சொல்',
    fullName: 'முழு பெயர்',
    phoneNumber: 'தொலைபேசி எண்',
    signIn: 'உள்நுழைக',
    signUp: 'பதிவு செய்க',
    forgotPassword: 'கடவுச்சொல் மறந்துவிட்டதா?',
    createAccount: 'கணக்கை உருவாக்கு',
    alreadyHaveAccount: 'ஏற்கனவே கணக்கு உள்ளதா?',
    dontHaveAccount: 'கணக்கு இல்லையா?',
    enterEmail: 'உங்கள் மின்னஞ்சலை உள்ளிடுக',
    enterPassword: 'உங்கள் கடவுச்சொல்லை உள்ளிடுக',
    // Complaint Form
    issueTitle: 'சிக்கல் தலைப்பு',
    selectCategory: 'வகையைத் தேர்ந்தெடுக்கவும்',
    location: 'இடம்',
    detailedDescription: 'விரிவான விளக்கம்',
    attachments: 'இணைப்புகள்',
    submitComplaint: 'புகார் சமர்ப்பிக்க',
    trackingId: 'கண்காணிப்பு ஐடி',
    // Profile
    panchayatResident: 'ஊராட்சி குடியிருப்பாளர்',
    editProfile: 'சுயவிவரத்தைத் திருத்து',
    updateProfile: 'சுயவிவரத்தைப் புதுப்பி',
    profileUpdated: 'சுயவிவரம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது',
    memberSince: 'உறுப்பினர் ஆன நாள்',
    // Alerts
    alert: 'எச்சரிக்கை',
    emergency: 'அவசரநிலை',
    important: 'முக்கியம்',
    notice: 'அறிவிப்பு',
    // Budget
    totalBudget: 'மொத்த பட்ஜெட்',
    allocated: 'ஒதுக்கப்பட்டது',
    spent: 'செலவிடப்பட்டது',
    remaining: 'மீதம்',
    fiscalYear: 'நிதி ஆண்டு',
    // Profile & Forms
    saveChanges: 'மாற்றங்களைச் சேமி',
    addressField: 'முகவரி',
    // Meetings Page
    gramSabhaMeetings: 'கிராம சபை கூட்டங்கள்',
    stayInformedMeetings: 'பொதுக் கூட்டங்களைப் பற்றி அறிந்திருங்கள் மற்றும் உள்ளாட்சியில் பங்கேற்கவும்',
    // Suggestions Page
    communitySuggestions: 'சமூக பரிந்துரைகள்',
    shareIdeasForDevelopment: 'கிராம வளர்ச்சி மற்றும் மேம்பாட்டிற்கான உங்கள் யோசனைகளைப் பகிருங்கள்',
    addSuggestion: 'பரிந்துரை சேர்க்க',
    newSuggestion: 'புதிய பரிந்துரை',
    // Budget Page
    budgetOverview: 'பட்ஜெட் மேலோட்டம்',
    transparencyInSpending: 'பொது செலவினங்களில் வெளிப்படைத்தன்மை - உங்கள் வரிப்பணம் எவ்வாறு பயன்படுத்தப்படுகிறது என்பதைப் பாருங்கள்',
    amountSpent: 'செலவிடப்பட்ட தொகை',
    utilized: 'பயன்படுத்தப்பட்டது',
    available: 'கிடைக்கிறது',
    overallUtilization: 'ஒட்டுமொத்த பயன்பாடு',
    budgetSpent: 'பட்ஜெட் செலவு',
    categoryWiseAllocation: 'வகை வாரியான ஒதுக்கீடு',
    // Filter Labels
    all: 'அனைத்தும்',
    urgent: 'அவசரம்',
    high: 'உயர்',
    normal: 'சாதாரணம்',
    low: 'குறைவு',
    // Status
    underReview: 'மறுஆய்வில்',
    approved: 'அங்கீகரிக்கப்பட்டது',
    implemented: 'செயல்படுத்தப்பட்டது',
    // Announcements
    stayUpdatedAnnouncements: 'சமீபத்திய செய்திகள் மற்றும் அறிவிப்புகளுடன் புதுப்பித்த நிலையில் இருங்கள்',
    noAnnouncementsAvailable: 'அறிவிப்புகள் எதுவும் இல்லை',
    // Common Actions
    upvote: 'ஆதரவு',
    thanksForVote: 'உங்கள் வாக்குக்கு நன்றி!',
    voteRemoved: 'வாக்கு அகற்றப்பட்டது'
  },
  hi: {
    // Navigation
    home: 'होम',
    about: 'हमारे बारे में',
    services: 'सेवाएं',
    contact: 'संपर्क',
    fileComplaint: 'शिकायत दर्ज करें',
    myComplaints: 'मेरी शिकायतें',
    announcements: 'घोषणाएं',
    profile: 'प्रोफ़ाइल',
    login: 'लॉगिन',
    register: 'रजिस्टर',
    logout: 'लॉगआउट',
    dashboard: 'डैशबोर्ड',
    // Common
    welcome: 'स्वागत',
    loading: 'लोड हो रहा है...',
    submit: 'जमा करें',
    cancel: 'रद्द करें',
    save: 'सहेजें',
    edit: 'संपादित करें',
    delete: 'हटाएं',
    search: 'खोजें',
    filter: 'फ़िल्टर',
    status: 'स्थिति',
    date: 'तारीख',
    description: 'विवरण',
    category: 'श्रेणी',
    priority: 'प्राथमिकता',
    // Panchayat
    panchayatName: 'गणपतिपालयम पंचायत',
    slogan: 'मिलकर हम अपना गाँव बनाते हैं',
    address: '2/783(41, मूगाम्बिगै नगर, गणपतिपालयम, पल्लदम, तमिलनाडु 641605',
    // Complaint Status
    pending: 'लंबित',
    inProgress: 'प्रगति में',
    resolved: 'हल किया गया',
    rejected: 'अस्वीकृत',
    // Messages
    noData: 'कोई डेटा उपलब्ध नहीं',
    error: 'एक त्रुटि हुई',
    success: 'सफलता'
  },
  te: {
    // Navigation
    home: 'హోమ్',
    about: 'మా గురించి',
    services: 'సేవలు',
    contact: 'సంప్రదించండి',
    fileComplaint: 'ఫిర్యాదు నమోదు',
    myComplaints: 'నా ఫిర్యాదులు',
    announcements: 'ప్రకటనలు',
    profile: 'ప్రొఫైల్',
    login: 'లాగిన్',
    register: 'రిజిస్టర్',
    logout: 'లాగౌట్',
    dashboard: 'డాష్‌బోర్డ్',
    // Common
    welcome: 'స్వాగతం',
    loading: 'లోడ్ అవుతోంది...',
    submit: 'సమర్పించు',
    cancel: 'రద్దు',
    save: 'సేవ్',
    edit: 'సవరించు',
    delete: 'తొలగించు',
    search: 'వెతుకు',
    filter: 'ఫిల్టర్',
    status: 'స్థితి',
    date: 'తేదీ',
    description: 'వివరణ',
    category: 'వర్గం',
    priority: 'ప్రాధాన్యత',
    // Panchayat
    panchayatName: 'గణపతిపాళయం పంచాయతీ',
    slogan: 'కలిసి మన గ్రామాన్ని నిర్మిద్దాం',
    address: '2/783(41, మూగాంబిగై నగర్, గణపతిపాళయం, పల్లడం, తమిళనాడు 641605',
    // Complaint Status
    pending: 'పెండింగ్',
    inProgress: 'ప్రగతిలో',
    resolved: 'పరిష్కరించబడింది',
    rejected: 'తిరస్కరించబడింది',
    // Messages
    noData: 'డేటా లేదు',
    error: 'లోపం సంభవించింది',
    success: 'విజయవంతం'
  },
  kn: {
    // Navigation
    home: 'ಮುಖಪುಟ',
    about: 'ನಮ್ಮ ಬಗ್ಗೆ',
    services: 'ಸೇವೆಗಳು',
    contact: 'ಸಂಪರ್ಕಿಸಿ',
    fileComplaint: 'ದೂರು ದಾಖಲಿಸಿ',
    myComplaints: 'ನನ್ನ ದೂರುಗಳು',
    announcements: 'ಪ್ರಕಟಣೆಗಳು',
    profile: 'ಪ್ರೊಫೈಲ್',
    login: 'ಲಾಗಿನ್',
    register: 'ನೋಂದಣಿ',
    logout: 'ಲಾಗ್ಔಟ್',
    dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    // Common
    welcome: 'ಸ್ವಾಗತ',
    loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
    submit: 'ಸಲ್ಲಿಸಿ',
    cancel: 'ರದ್ದುಮಾಡಿ',
    save: 'ಉಳಿಸಿ',
    edit: 'ಸಂಪಾದಿಸಿ',
    delete: 'ಅಳಿಸಿ',
    search: 'ಹುಡುಕಿ',
    filter: 'ಫಿಲ್ಟರ್',
    status: 'ಸ್ಥಿತಿ',
    date: 'ದಿನಾಂಕ',
    description: 'ವಿವರಣೆ',
    category: 'ವರ್ಗ',
    priority: 'ಆದ್ಯತೆ',
    // Panchayat
    panchayatName: 'ಗಣಪತಿಪಾಳಯಂ ಪಂಚಾಯತ್',
    slogan: 'ಒಟ್ಟಾಗಿ ನಮ್ಮ ಗ್ರಾಮವನ್ನು ಕಟ್ಟೋಣ',
    address: '2/783(41, ಮೂಗಾಂಬಿಗೈ ನಗರ್, ಗಣಪತಿಪಾಳಯಂ, ಪಲ್ಲಡಂ, ತಮಿಳುನಾಡು 641605',
    // Complaint Status
    pending: 'ಬಾಕಿ',
    inProgress: 'ಪ್ರಗತಿಯಲ್ಲಿ',
    resolved: 'ಪರಿಹರಿಸಲಾಗಿದೆ',
    rejected: 'ತಿರಸ್ಕರಿಸಲಾಗಿದೆ',
    // Messages
    noData: 'ಯಾವುದೇ ಡೇಟಾ ಇಲ್ಲ',
    error: 'ದೋಷ ಸಂಭವಿಸಿದೆ',
    success: 'ಯಶಸ್ವಿ'
  },
  ml: {
    // Navigation
    home: 'ഹോം',
    about: 'ഞങ്ങളെക്കുറിച്ച്',
    services: 'സേവനങ്ങൾ',
    contact: 'ബന്ധപ്പെടുക',
    fileComplaint: 'പരാതി രജിസ്റ്റർ',
    myComplaints: 'എന്റെ പരാതികൾ',
    announcements: 'അറിയിപ്പുകൾ',
    profile: 'പ്രൊഫൈൽ',
    login: 'ലോഗിൻ',
    register: 'രജിസ്റ്റർ',
    logout: 'ലോഗൗട്ട്',
    dashboard: 'ഡാഷ്ബോർഡ്',
    // Common
    welcome: 'സ്വാഗതം',
    loading: 'ലോഡ് ചെയ്യുന്നു...',
    submit: 'സമർപ്പിക്കുക',
    cancel: 'റദ്ദാക്കുക',
    save: 'സേവ് ചെയ്യുക',
    edit: 'എഡിറ്റ്',
    delete: 'ഇല്ലാതാക്കുക',
    search: 'തിരയുക',
    filter: 'ഫിൽട്ടർ',
    status: 'നില',
    date: 'തീയതി',
    description: 'വിവരണം',
    category: 'വിഭാഗം',
    priority: 'മുൻഗണന',
    // Panchayat
    panchayatName: 'ഗണപതിപാളയം പഞ്ചായത്ത്',
    slogan: 'ഒത്തൊരുമിച്ച് നമ്മുടെ ഗ്രാമം കെട്ടിപ്പടുക്കാം',
    address: '2/783(41, മൂഗാംബിഗൈ നഗർ, ഗണപതിപാളയം, പല്ലടം, തമിഴ്‌നാട് 641605',
    // Complaint Status
    pending: 'തീർപ്പാക്കാത്ത',
    inProgress: 'പുരോഗതിയിൽ',
    resolved: 'പരിഹരിച്ചു',
    rejected: 'നിരസിച്ചു',
    // Messages
    noData: 'ഡാറ്റ ലഭ്യമല്ല',
    error: 'ഒരു പിശക് സംഭവിച്ചു',
    success: 'വിജയം'
  }
};

// Supported languages
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' }
];

export const TranslationProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    return localStorage.getItem('preferredLanguage') || 'ta';
  });
  const [translations, setTranslations] = useState(STATIC_TRANSLATIONS);
  const [dynamicCache, setDynamicCache] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);

  // Save language preference
  useEffect(() => {
    localStorage.setItem('preferredLanguage', currentLanguage);
  }, [currentLanguage]);

  // Get static translation
  const t = useCallback((key) => {
    const langTranslations = translations[currentLanguage] || translations['en'];
    return langTranslations[key] || translations['en'][key] || key;
  }, [currentLanguage, translations]);

  // Translate dynamic text using API
  const translateText = useCallback(async (text, forceRefresh = false) => {
    if (!text || currentLanguage === 'en') {
      return text;
    }

    // Check cache first
    const cacheKey = `${text}_${currentLanguage}`;
    if (!forceRefresh && dynamicCache[cacheKey]) {
      return dynamicCache[cacheKey];
    }

    try {
      setIsTranslating(true);
      const result = await translateService.translate(text, currentLanguage, 'en');
      
      if (result.success) {
        // Update cache
        setDynamicCache(prev => ({
          ...prev,
          [cacheKey]: result.translatedText
        }));
        return result.translatedText;
      }
      return text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    } finally {
      setIsTranslating(false);
    }
  }, [currentLanguage, dynamicCache]);

  // Batch translate multiple texts
  const translateBatch = useCallback(async (texts) => {
    if (!texts || texts.length === 0 || currentLanguage === 'en') {
      return texts;
    }

    // Check which texts need translation
    const textsToTranslate = [];
    const cachedResults = {};

    texts.forEach((text, index) => {
      const cacheKey = `${text}_${currentLanguage}`;
      if (dynamicCache[cacheKey]) {
        cachedResults[index] = dynamicCache[cacheKey];
      } else {
        textsToTranslate.push({ text, index });
      }
    });

    // If all cached, return immediately
    if (textsToTranslate.length === 0) {
      return texts.map((_, index) => cachedResults[index]);
    }

    try {
      setIsTranslating(true);
      const result = await translateService.batchTranslate(
        textsToTranslate.map(t => t.text),
        currentLanguage,
        'en'
      );

      if (result.success) {
        // Update cache with new translations
        const newCache = { ...dynamicCache };
        result.translations.forEach((trans, i) => {
          const originalText = textsToTranslate[i].text;
          const cacheKey = `${originalText}_${currentLanguage}`;
          newCache[cacheKey] = trans.translated;
          cachedResults[textsToTranslate[i].index] = trans.translated;
        });
        setDynamicCache(newCache);
      }

      // Return all results in order
      return texts.map((text, index) => cachedResults[index] || text);
    } catch (error) {
      console.error('Batch translation error:', error);
      return texts;
    } finally {
      setIsTranslating(false);
    }
  }, [currentLanguage, dynamicCache]);

  // Change language
  const changeLanguage = useCallback((langCode) => {
    if (SUPPORTED_LANGUAGES.some(l => l.code === langCode)) {
      setCurrentLanguage(langCode);
    }
  }, []);

  const value = {
    currentLanguage,
    languages: SUPPORTED_LANGUAGES,
    t,
    translateText,
    translateBatch,
    changeLanguage,
    isTranslating
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

export default TranslationContext;
