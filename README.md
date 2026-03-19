# Kids Planner

Kids Planner is a React + Vite app for organizing family school life in one place. It gives parents a calm dashboard for tracking assignments, weekly routines, reading minutes, important school dates, and uploaded weekly school files for multiple kids.

## Overview

This project is designed as a lightweight family school hub. Instead of juggling paper packets, reading logs, sticky notes, and scattered reminders, you can manage the week in a single interface built around real parent workflows.

It currently runs fully in the browser with local storage, which makes it easy to test, customize, and expand into a future cloud-connected version.

## Quick Look

- Built for multi-child homework and school planning
- Includes assignments, planner tasks, reading logs, files, and important dates
- Supports guided PDF import for weekly school handouts
- Uses local browser storage, so no backend setup is required

## Screenshot

Add a project screenshot here once you have one available:

```md
![Kids Planner dashboard](./docs/kids-planner-dashboard.png)
```

## Features

- Dashboard with quick stats, today’s tasks, upcoming dates, and weekly notes
- Assignment tracking with filters for child, subject, status, and search
- Weekly planner for building routines and generating plan items from assignments
- Reading log for tracking minutes, pages, and notes
- Important dates for quizzes, tests, projects, reminders, and events
- File records for weekly school documents
- Guided weekly import flow that extracts text from PDF uploads and turns it into suggested assignments and dates
- Local persistence using browser `localStorage`

## Tech Stack

- React 18
- Vite 5
- Tailwind CSS
- `pdfjs-dist` for PDF text extraction

## Getting Started

### Prerequisites

- Node.js 18+ recommended
- npm

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Then open the local Vite URL shown in the terminal.

### Build for production

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

## How It Works

The app starts with sample family data and stores changes in the browser, so edits stay on your machine unless you clear site storage. There is no backend yet, which keeps the project simple to run and easy to customize.

The Weekly Import flow is designed for school handouts and weekly packets. When you upload a PDF, the app extracts text, suggests assignments and important dates, lets you review them, and then merges accepted items into the planner data.

## Project Structure

```text
src/
  components/   UI views for each planner section
  data/         sample data and shared option lists
  hooks/        reusable state and form hooks
  lib/          helpers, storage logic, validation, and import utilities
```

## Notes

- Project data is currently stored in `localStorage`, not a database
- Uploaded files are tracked as records in the app; the files themselves are not saved to a server
- PDF import quality depends on how readable the source PDF text is

## Future Ideas

- Add authentication and cloud sync
- Save real uploaded files to storage
- Share planner views with caregivers or teachers
- Add calendar export and notifications

## Suggested GitHub Description

Kids Planner is a family school dashboard for tracking assignments, routines, reading logs, files, and important dates.
