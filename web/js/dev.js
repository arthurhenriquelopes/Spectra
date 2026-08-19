export const devData = {
    name: 'Arthur Henrique Lopes Feitosa',
    company: 'Midas Systems Development',
    role: 'Junior Java Developer',
    focus: 'coding',
    resume: `Arthur Henrique Lopes Feitosa
Junior Java Developer | Focus on Back-End with Spring Boot

Professional Summary
Information Systems student with experience in software development, specializing in back-end development with Spring Boot, RESTful APIs, PostgreSQL, and Docker. Experienced in a real-world production environment, contributing to improved code quality and operational efficiency in multidisciplinary agile teams. Committed to good development practices, automated testing, and continuous delivery.

Professional Experience
Midas Systems Development
Software Development Intern | June 2025 — June 2026
- Developed an intelligent chatbot using Spring Boot and Flutter/Dart, improving user interaction by 20%.
- Created mobile screens and integrated LLM for document processing via OCR, increasing accuracy by 15%.
- Collaborated in agile teams, improving code quality and operational efficiency.
- Implemented automated testing, reducing bugs by 30% and accelerating the development cycle.

Academic Background
Federal Institute of Maranhão (IFMA) | March 2024 — March 2028
Bachelor's degree in Information Systems

Skills
Back-End: Java, Spring Boot, REST APIs, Microservices, Spring Security, JWT, Redis, PostgreSQL, Docker.
Tools and Methodologies: JUnit, Mockito, CI/CD, Gradle, SOLID, Clean Code, Design Patterns, Git, GitHub, Linux, Bash Scripting.
Front-End: React, Angular, TypeScript, Flutter, Dart.
Other Languages and Technologies: Python, SQL, Prompt Engineering, AI applied to development, Swagger, Unit and Integration Testing.

Projects
DistroWiki — Developer
SIGAMA Vision — Developer
LLMX — Developer`,
    objectives: `Job Description
Company: Tech Innovations Inc.
Role: Junior Java Developer

We are looking for a Junior Java Developer to join our backend engineering team. You will work on building scalable APIs using Spring Boot.

Requirements:
- Strong knowledge of Java and Object-Oriented Programming.
- Experience with Spring Boot, REST APIs, and PostgreSQL.
- Understanding of Git, Docker, and CI/CD pipelines.
- Willingness to learn and work in an agile team environment.`
};

import { devLog } from './config.js';

export function autofillForTesting() {
    devLog("Autofilling form for testing...");

    // Get form elements directly from DOM
    const onboardingForm = {
        name: document.getElementById('user-name'),
        company: document.getElementById('user-company'),
        role: document.getElementById('user-role'),
        focusCheckboxes: document.querySelectorAll('input[name="focus"]'),
        resume: document.getElementById('user-resume'),
        objectives: document.getElementById('user-objectives'),
    };

    // Check if elements exist before setting values
    if (onboardingForm.name) onboardingForm.name.value = devData.name;
    if (onboardingForm.company) onboardingForm.company.value = devData.company;
    if (onboardingForm.role) onboardingForm.role.value = devData.role;

    if (onboardingForm.focusCheckboxes) {
        onboardingForm.focusCheckboxes.forEach(cb => {
            if (cb.value === devData.focus) {
                cb.checked = true;
            }
        });
    }

    if (onboardingForm.resume) onboardingForm.resume.value = devData.resume;
    if (onboardingForm.objectives) onboardingForm.objectives.value = devData.objectives;

    devLog("✅ Form autofilled successfully!");
}