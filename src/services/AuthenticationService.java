package services;

import models.User;
import enums.Role;
import exceptions.AuthenticationException;
import exceptions.RegistrationException;
import utils.Validator;

import java.util.*;

public class AuthenticationService {
    private static AuthenticationService instance;
    private Map<String, User> users; // Email -> User mapping
    private User currentUser;
    private static final String ADMIN_EMAIL = "admin@Namma Tirupur.com"; // Unique admin email
    private boolean adminRegistered = false;

    // Private constructor for Singleton pattern
    private AuthenticationService() {
        users = new HashMap<>();
    }

    // Singleton instance
    public static AuthenticationService getInstance() {
        if (instance == null) {
            instance = new AuthenticationService();
        }
        return instance;
    }

    /**
     * Register a new user
     */
    public User register(String name, String email, String password, String role) throws RegistrationException {
        // Validate inputs
        if (!Validator.isValidName(name)) {
            throw new RegistrationException("Invalid name. Name must be at least 2 characters.");
        }

        if (!Validator.isValidEmail(email)) {
            throw new RegistrationException("Invalid email format.");
        }

        if (!Validator.isValidPassword(password)) {
            throw new RegistrationException("Password must be at least 6 characters long.");
        }

        // Check if email already exists
        if (users.containsKey(email.toLowerCase())) {
            throw new RegistrationException("Email already registered. Please login.");
        }

        // Admin registration validation
        if ("ADMIN".equalsIgnoreCase(role)) {
            if (adminRegistered) {
                throw new RegistrationException("Admin already registered. Only one admin is allowed.");
            }
            if (!email.equalsIgnoreCase(ADMIN_EMAIL)) {
                throw new RegistrationException("Invalid admin email. Admin must use: " + ADMIN_EMAIL);
            }
            adminRegistered = true;
        }

        // Create user
        String userId = generateUserId(role);
        User newUser = new User(userId, name, email.toLowerCase(), password, role.toUpperCase());
        users.put(email.toLowerCase(), newUser);

        System.out.println("✅ Registration successful!");
        return newUser;
    }

    /**
     * Login user
     */
    public User login(String email, String password) throws AuthenticationException {
        if (!Validator.isValidEmail(email)) {
            throw new AuthenticationException("Invalid email format.");
        }

        User user = users.get(email.toLowerCase());
        
        if (user == null) {
            throw new AuthenticationException("Email not registered. Please register first.");
        }

        if (!user.getPassword().equals(password)) {
            throw new AuthenticationException("Incorrect password.");
        }

        currentUser = user;
        System.out.println("✅ Login successful! Welcome, " + user.getName());
        return user;
    }

    /**
     * Logout current user
     */
    public void logout() {
        if (currentUser != null) {
            System.out.println("👋 Goodbye, " + currentUser.getName());
            currentUser = null;
        }
    }

    /**
     * Get current logged-in user
     */
    public User getCurrentUser() {
        return currentUser;
    }

    /**
     * Check if user is logged in
     */
    public boolean isLoggedIn() {
        return currentUser != null;
    }

    /**
     * Check if current user is admin
     */
    public boolean isCurrentUserAdmin() {
        return currentUser != null && currentUser.isAdmin();
    }

    /**
     * Update user profile
     */
    public void updateProfile(String area, String contact) throws AuthenticationException {
        if (!isLoggedIn()) {
            throw new AuthenticationException("Please login first.");
        }

        if (contact != null && !contact.isEmpty() && !Validator.isValidContact(contact)) {
            throw new AuthenticationException("Invalid contact number. Must be 10 digits.");
        }

        currentUser.setArea(area);
        currentUser.setContact(contact);
        System.out.println("✅ Profile updated successfully!");
    }

    /**
     * Generate unique user ID
     */
    private String generateUserId(String role) {
        String prefix = role.equalsIgnoreCase("ADMIN") ? "ADM" : "USR";
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    /**
     * Get all registered users (Admin only)
     */
    public List<User> getAllUsers() throws AuthenticationException {
        if (!isCurrentUserAdmin()) {
            throw new AuthenticationException("Access denied. Admin only.");
        }
        return new ArrayList<>(users.values());
    }

    /**
     * Check if admin is registered
     */
    public boolean isAdminRegistered() {
        return adminRegistered;
    }

    /**
     * Get admin email (for display purposes)
     */
    public static String getAdminEmail() {
        return ADMIN_EMAIL;
    }
}
