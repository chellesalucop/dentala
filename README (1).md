# 🦷 Dentala - Clinic Management & Appointment System

## 📖 Overview
**Dentala** is an innovative, web-based clinic management platform that modernizes the dental experience. It resolves operational gaps in traditional dental clinic management—such as manual record-keeping and uncoordinated scheduling—by integrating real-time synchronization and automated notifications. 

By transitioning to a secure, centralized digital platform, Dentala ensures high-integrity patient record handling and allows dental professionals to focus entirely on quality clinical care.

## ✨ Key Features
* **Real-Time Booking Engine:** Dynamic scheduling that prevents double-bookings and conflicts with live status updates.
* **Walk-In Management:** Dedicated modules for admins to seamlessly add and manage walk-in patients alongside online bookings.
* **Automated Notifications (via Brevo):** Reliable SMTP email alerts for appointment confirmations, OTP verification, and walk-in receipts to reduce "no-shows".
* **Cloud Media Storage (via Cloudinary):** Secure, scalable hosting for patient profile pictures and clinic assets, ensuring fast load times and database efficiency.
* **Centralized Digital Records:** A secure database for patient histories, ensuring clinical data is never lost or fragmented.
* **Multi-Level Access:** Role-based dashboards for Admins (Dentists/Staff) and Patients. Includes robust handling for primary accounts managing family dependents.
* **High Availability & Testing:** Cloud-ready architecture (hosted on Render) with configured load-testing (`k6`) to ensure scalable performance.

## 💻 Tech Stack
* **Frontend:** React.js, Vite, Tailwind CSS, Axios
* **Backend:** Laravel (PHP 11), Sanctum (API Authentication)
* **Database & Storage:** MySQL, **Cloudinary** (Media & Asset Management)
* **Tools & Infrastructure:** Render (Cloud Hosting), **Brevo** (SMTP Email Delivery), K6 (Performance Testing)

---

## 📂 Repository Structure
This repository is configured as a monorepo containing both the React frontend and the Laravel backend API.

```text
dentala/
├── dentala-frontend/    # React User Interface (Vite)
├── dentala-backend/     # Laravel API & Business Logic
├── k6-test.js           # Load testing configuration
└── render.yaml          # Cloud deployment configuration
```

---

### 1. Clone the repository
```bash
git clone [https://github.com/chellesalucop/dentala.git](https://github.com/chellesalucop/dentala.git)
cd dentala
```

### 2. Backend Setup (Laravel API)
Open a terminal and navigate to the backend folder:
```bash
cd dentala-backend

# Install PHP dependencies
composer install

# Set up environment variables
cp .env.example .env

# Generate application key
php artisan key:generate

# Run database migrations and seeders (Creates tables & default admin)
php artisan migrate --seed

# Start the Laravel development server
php artisan serve
```
*(Note: To test email notifications locally, ensure you configure your `MAIL_` settings with your Brevo credentials and `CLOUDINARY_` settings in the `.env` file. Run the queue worker using `php artisan queue:work` or the provided `start-queue-worker.sh` script).*

### 3. Frontend Setup (React UI)
Open a **new** terminal window and navigate to the frontend folder:
```bash
cd dentala-frontend

# Install JavaScript dependencies
npm install

# Start the Vite development server
npm run dev
```

### 4. Access the Application
* **Frontend UI:** `http://localhost:5173`
* **Backend API:** `http://localhost:8000`
