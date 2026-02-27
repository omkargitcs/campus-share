Campus Share

A Modern, Secure Academic Resource Hub

Campus Share is a full-stack platform built with the PERN stack 
(PostgreSQL, Express, React, Node.js) designed to help students share and access quality notes, 
textbooks, and Previous Year Questions (PYQs) in a sleek, "Lively" dark-themed environment.

UI/UX: A premium dark-mode dashboard featuring glassmorphism, smooth CSS transitions, and an intuitive grid layout.
Dynamic Filtering: Instant, client-side filtering for resources (Books, Notes, PYQs) using optimized state management.
Toast Notifications: Real-time user feedback powered by Sonner for a crash-free notification experience.
Responsive Design: Fully optimized for mobile, tablet, and desktop viewing.

Secure Auth: Stateless authentication using JWT (JSON Web Tokens) with secure password hashing.
Prisma ORM: Robust database communication with a strongly-typed schema for PostgreSQL.
Media Management: Integrated with Cloudinary for high-performance image and document handling.
RESTful API: A clean, modular Express.js architecture with dedicated routes and middleware for error handling.


Frontend	React 19, Vite, Tailwind CSS, Lucide Icons
Backend	Node.js, Express.js
Database	PostgreSQL with Prisma ORM
Storage	Cloudinary
Security	JWT, Bcrypt

Clone the Repository:

Bash
git clone https://github.com/omkargitcs/campus-share.git
cd campus-share

Setup Backend:
Bash
cd server
npm install

Create a .env file based on .env.example
npx prisma generate
npm start

Setup Frontend:
Bash
cd ../client
npm install
npm run dev
