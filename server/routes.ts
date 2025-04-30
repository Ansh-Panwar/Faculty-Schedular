import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { storage } from "./storage";
import { 
  bookAppointmentSchema, 
  searchFacultySchema, 
  type Faculty, 
  type FacultySearchResult 
} from "@shared/schema";
import { 
  sendFacultyAppointmentRequest,
  sendStudentAppointmentConfirmation 
} from "@shared/sendgrid";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // API route prefix
  const apiPrefix = "/api";

  // Error handler middleware
  const handleError = (err: unknown, res: Response) => {
    console.error("API Error:", err);

    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ 
        message: "Validation error", 
        errors: validationError.details 
      });
    }

    if (err instanceof Error) {
      return res.status(500).json({ message: err.message });
    }

    return res.status(500).json({ message: "Unknown error occurred" });
  };

  // Get all faculty
  app.get(`${apiPrefix}/faculty`, async (_req: Request, res: Response) => {
    try {
      const faculty = await storage.getAllFaculty();
      return res.json(faculty);
    } catch (err) {
      return handleError(err, res);
    }
  });
  
  // Get user appointments (for demonstration, returns all appointments)
  app.get(`${apiPrefix}/my-appointments`, async (_req: Request, res: Response) => {
    try {
      // In a real application, you would filter by the logged-in user
      // For now, we're just returning all appointments for demonstration
      const appointments = Array.from(storage.getAllAppointments());
      return res.json(appointments);
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Get faculty by ID
  app.get(`${apiPrefix}/faculty/:id`, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid faculty ID" });
      }

      const faculty = await storage.getFaculty(id);
      if (!faculty) {
        return res.status(404).json({ message: "Faculty not found" });
      }

      return res.json(faculty);
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Get time slots for a faculty on a specific day
  app.get(`${apiPrefix}/faculty/:id/time-slots/:day`, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { day } = req.params;

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid faculty ID" });
      }

      const faculty = await storage.getFaculty(id);
      if (!faculty) {
        return res.status(404).json({ message: "Faculty not found" });
      }

      const timeSlots = await storage.getTimeSlots(id, day.toLowerCase());
      return res.json(timeSlots);
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Search faculty availability
  app.post(`${apiPrefix}/faculty/search`, async (req: Request, res: Response) => {
    try {
      const searchCriteria = searchFacultySchema.parse(req.body);
      
      const result = await storage.searchFacultyAvailability(searchCriteria);
      if (!result) {
        return res.status(404).json({ 
          message: "No faculty found matching your search criteria" 
        });
      }

      return res.json(result);
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Book an appointment
  app.post(`${apiPrefix}/appointments`, async (req: Request, res: Response) => {
    try {
      const bookingData = bookAppointmentSchema.parse(req.body);
      
      // Validate that faculty exists
      const faculty = await storage.getFaculty(bookingData.facultyId);
      if (!faculty) {
        return res.status(404).json({ message: "Faculty not found" });
      }

      // Validate that time slot exists and is available
      const timeSlot = await storage.getTimeSlot(bookingData.timeSlotId);
      if (!timeSlot) {
        return res.status(404).json({ message: "Time slot not found" });
      }

      if (!timeSlot.isAvailable) {
        return res.status(400).json({ message: "This time slot is not available" });
      }

      // Create appointment
      const appointment = await storage.createAppointment(bookingData);

      // Format the time for display in emails
      const timeDisplay = `${timeSlot.startTime} - ${timeSlot.endTime}`;
      
      // Generate accept/reject URLs
      const acceptUrl = `${req.protocol}://${req.get('host')}/api/appointments/${appointment.id}/accept?token=${appointment.token}`;
      const rejectUrl = `${req.protocol}://${req.get('host')}/api/appointments/${appointment.id}/reject?token=${appointment.token}`;

      // Send email to faculty
      try {
        await sendFacultyAppointmentRequest(
          faculty.email,
          bookingData.studentEmail,
          bookingData.studentName,
          bookingData.appointmentDate,
          timeDisplay,
          acceptUrl,
          rejectUrl
        );
      } catch (emailError) {
        console.error("Failed to send faculty email:", emailError);
        // Continue execution, don't fail the request because of email issues
      }

      return res.status(201).json(appointment);
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Accept appointment
  app.get(`${apiPrefix}/appointments/:id/accept`, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { token } = req.query;

      if (isNaN(id) || typeof token !== 'string') {
        return res.status(400).json({ message: "Invalid appointment ID or token" });
      }

      // Verify token
      const appointment = await storage.getAppointmentByToken(token);
      if (!appointment || appointment.id !== id) {
        return res.status(403).json({ message: "Invalid token" });
      }

      // Update appointment status
      const updatedAppointment = await storage.updateAppointmentStatus(id, 'accepted');
      if (!updatedAppointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      // Get faculty and time slot data for email
      const faculty = await storage.getFaculty(updatedAppointment.facultyId);
      const timeSlot = await storage.getTimeSlot(updatedAppointment.timeSlotId);
      
      if (!faculty || !timeSlot) {
        return res.status(500).json({ message: "Could not retrieve faculty or time slot information" });
      }

      // Format the time for display in emails
      const timeDisplay = `${timeSlot.startTime} - ${timeSlot.endTime}`;

      // Send confirmation email to student
      try {
        await sendStudentAppointmentConfirmation(
          updatedAppointment.studentEmail,
          faculty.name,
          updatedAppointment.appointmentDate,
          timeDisplay,
          'accepted'
        );
      } catch (emailError) {
        console.error("Failed to send student confirmation email:", emailError);
        // Continue execution, don't fail the request because of email issues
      }

      // Return a simple HTML response
      res.send(`
        <html>
          <head>
            <title>Appointment Accepted</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem; text-align: center; }
              .success { color: #10b981; font-size: 1.5rem; margin-bottom: 1rem; }
              .details { background-color: #f3f4f6; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0; text-align: left; }
            </style>
          </head>
          <body>
            <h1 class="success">Appointment Accepted</h1>
            <p>You have successfully accepted the appointment request.</p>
            <div class="details">
              <p><strong>Student:</strong> ${updatedAppointment.studentName}</p>
              <p><strong>Date:</strong> ${updatedAppointment.appointmentDate}</p>
              <p><strong>Time:</strong> ${timeDisplay}</p>
            </div>
            <p>An email confirmation has been sent to the student.</p>
          </body>
        </html>
      `);
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Reject appointment
  app.get(`${apiPrefix}/appointments/:id/reject`, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { token } = req.query;

      if (isNaN(id) || typeof token !== 'string') {
        return res.status(400).json({ message: "Invalid appointment ID or token" });
      }

      // Verify token
      const appointment = await storage.getAppointmentByToken(token);
      if (!appointment || appointment.id !== id) {
        return res.status(403).json({ message: "Invalid token" });
      }

      // Update appointment status
      const updatedAppointment = await storage.updateAppointmentStatus(id, 'rejected');
      if (!updatedAppointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      // Get faculty and time slot data for email
      const faculty = await storage.getFaculty(updatedAppointment.facultyId);
      const timeSlot = await storage.getTimeSlot(updatedAppointment.timeSlotId);
      
      if (!faculty || !timeSlot) {
        return res.status(500).json({ message: "Could not retrieve faculty or time slot information" });
      }

      // Format the time for display in emails
      const timeDisplay = `${timeSlot.startTime} - ${timeSlot.endTime}`;

      // Send rejection email to student
      try {
        await sendStudentAppointmentConfirmation(
          updatedAppointment.studentEmail,
          faculty.name,
          updatedAppointment.appointmentDate,
          timeDisplay,
          'rejected'
        );
      } catch (emailError) {
        console.error("Failed to send student rejection email:", emailError);
        // Continue execution, don't fail the request because of email issues
      }

      // Return a simple HTML response
      res.send(`
        <html>
          <head>
            <title>Appointment Rejected</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem; text-align: center; }
              .rejected { color: #ef4444; font-size: 1.5rem; margin-bottom: 1rem; }
              .details { background-color: #f3f4f6; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0; text-align: left; }
            </style>
          </head>
          <body>
            <h1 class="rejected">Appointment Rejected</h1>
            <p>You have rejected the appointment request.</p>
            <div class="details">
              <p><strong>Student:</strong> ${updatedAppointment.studentName}</p>
              <p><strong>Date:</strong> ${updatedAppointment.appointmentDate}</p>
              <p><strong>Time:</strong> ${timeDisplay}</p>
            </div>
            <p>A notification has been sent to the student.</p>
          </body>
        </html>
      `);
    } catch (err) {
      return handleError(err, res);
    }
  });

  return httpServer;
}
