import { 
  Faculty, 
  InsertFaculty, 
  TimeSlot, 
  InsertTimeSlot, 
  FacultySearchResult, 
  SearchFaculty,
  Appointment,
  InsertAppointment,
  BookAppointment,
  AppointmentStatus
} from "@shared/schema";
import crypto from 'crypto';

// Simple function to handle undefined values in objects
function ensureNotUndefined<T>(obj: T): T {
  // This is a simplified approach that works for our use case
  return JSON.parse(JSON.stringify(obj));
}

// Function to generate a random token
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Interface for storage operations
export interface IStorage {
  // Faculty operations
  getFaculty(id: number): Promise<Faculty | undefined>;
  getFacultyByName(name: string): Promise<Faculty | undefined>;
  getAllFaculty(): Promise<Faculty[]>;
  createFaculty(faculty: InsertFaculty): Promise<Faculty>;
  
  // Time slot operations
  getTimeSlot(id: number): Promise<TimeSlot | undefined>;
  getTimeSlots(facultyId: number, day: string): Promise<TimeSlot[]>;
  createTimeSlot(timeSlot: InsertTimeSlot): Promise<TimeSlot>;
  
  // Search operation
  searchFacultyAvailability(search: SearchFaculty): Promise<FacultySearchResult | null>;
  
  // Appointment operations
  createAppointment(bookingData: BookAppointment): Promise<Appointment>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  getAppointmentByToken(token: string): Promise<Appointment | undefined>;
  updateAppointmentStatus(id: number, status: AppointmentStatus): Promise<Appointment | undefined>;
  getAllAppointments(): Appointment[];
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private faculties: Map<number, Faculty>;
  private slots: Map<number, TimeSlot>;
  private appointments: Map<number, Appointment>;
  private appointmentsByToken: Map<string, number>;
  private currentFacultyId: number;
  private currentSlotId: number;
  private currentAppointmentId: number;

  constructor() {
    this.faculties = new Map();
    this.slots = new Map();
    this.appointments = new Map();
    this.appointmentsByToken = new Map();
    this.currentFacultyId = 1;
    this.currentSlotId = 1;
    this.currentAppointmentId = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample faculty
    const faculty1: Faculty = {
      id: this.currentFacultyId++,
      name: "Dr. Shahina Anwarul",
      department: "Department of Computer Science",
      title: "Associate Professor",
      email: "sanwarul@ddn.upes.ac.in",
      officeLocation: "IT Block, 3rd Floor, Room 305",
      profileImage: "https://upes.irins.org/assets/profile_images/92073.jpg"
    };
    
    const faculty2: Faculty = {
      id: this.currentFacultyId++,
      name: "Dr. Michael Smith",
      department: "Department of Mathematics",
      title: "Professor",
      email: "msmith@university.edu",
      officeLocation: "Math Building, Room 201",
      profileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80"
    };
    
    this.faculties.set(faculty1.id, faculty1);
    this.faculties.set(faculty2.id, faculty2);
    
    // Create time slots for faculty1 (Sarah Johnson)
    const mondaySlots: InsertTimeSlot[] = [
      { facultyId: faculty1.id, day: "monday", startTime: "8:00", endTime: "9:00", isAvailable: true, reason: "Office Hours" },
      { facultyId: faculty1.id, day: "monday", startTime: "9:00", endTime: "10:00", isAvailable: true, reason: "Office Hours" },
      { facultyId: faculty1.id, day: "monday", startTime: "10:00", endTime: "11:00", isAvailable: false, reason: "Teaching CS 101" },
      { facultyId: faculty1.id, day: "monday", startTime: "11:00", endTime: "12:00", isAvailable: true, reason: "Office Hours" },
      { facultyId: faculty1.id, day: "monday", startTime: "12:00", endTime: "13:00", isAvailable: false, reason: "Lunch Break" },
      { facultyId: faculty1.id, day: "monday", startTime: "13:00", endTime: "14:00", isAvailable: false, reason: "Department Meeting" },
      { facultyId: faculty1.id, day: "monday", startTime: "14:00", endTime: "15:00", isAvailable: true, reason: "Computer Lab, Room 101" },
      { facultyId: faculty1.id, day: "monday", startTime: "15:00", endTime: "16:00", isAvailable: false, reason: "Research Time" },
      { facultyId: faculty1.id, day: "monday", startTime: "16:00", endTime: "17:00", isAvailable: true, reason: "Office Hours" }
    ];
    
    const tuesdaySlots: InsertTimeSlot[] = [
      { facultyId: faculty1.id, day: "tuesday", startTime: "8:00", endTime: "9:00", isAvailable: false, reason: "Faculty Meeting" },
      { facultyId: faculty1.id, day: "tuesday", startTime: "9:00", endTime: "10:00", isAvailable: false, reason: "Teaching CS 202" },
      { facultyId: faculty1.id, day: "tuesday", startTime: "10:00", endTime: "11:00", isAvailable: false, reason: "Teaching CS 202" },
      { facultyId: faculty1.id, day: "tuesday", startTime: "11:00", endTime: "12:00", isAvailable: true, reason: "Office Hours" },
      { facultyId: faculty1.id, day: "tuesday", startTime: "12:00", endTime: "13:00", isAvailable: false, reason: "Lunch Break" },
      { facultyId: faculty1.id, day: "tuesday", startTime: "13:00", endTime: "14:00", isAvailable: true, reason: "Office Hours" },
      { facultyId: faculty1.id, day: "tuesday", startTime: "14:00", endTime: "15:00", isAvailable: true, reason: "Office Hours" },
      { facultyId: faculty1.id, day: "tuesday", startTime: "15:00", endTime: "16:00", isAvailable: false, reason: "Research Time" },
      { facultyId: faculty1.id, day: "tuesday", startTime: "16:00", endTime: "17:00", isAvailable: true, reason: "Office Hours" }
    ];
    
    // Create slots for other weekdays for faculty1
    const wednesdaySlots: InsertTimeSlot[] = [
      { facultyId: faculty1.id, day: "wednesday", startTime: "8:00", endTime: "9:00", isAvailable: true, reason: "Office Hours" },
      { facultyId: faculty1.id, day: "wednesday", startTime: "9:00", endTime: "11:00", isAvailable: false, reason: "Research Time" },
      { facultyId: faculty1.id, day: "wednesday", startTime: "11:00", endTime: "12:00", isAvailable: true, reason: "Office Hours" },
      { facultyId: faculty1.id, day: "wednesday", startTime: "12:00", endTime: "13:00", isAvailable: false, reason: "Lunch Break" },
      { facultyId: faculty1.id, day: "wednesday", startTime: "13:00", endTime: "15:00", isAvailable: false, reason: "Teaching CS 305" },
      { facultyId: faculty1.id, day: "wednesday", startTime: "15:00", endTime: "17:00", isAvailable: true, reason: "Office Hours" }
    ];
    
    const thursdaySlots: InsertTimeSlot[] = [
      { facultyId: faculty1.id, day: "thursday", startTime: "8:00", endTime: "10:00", isAvailable: false, reason: "Department Meeting" },
      { facultyId: faculty1.id, day: "thursday", startTime: "10:00", endTime: "12:00", isAvailable: true, reason: "Office Hours" },
      { facultyId: faculty1.id, day: "thursday", startTime: "12:00", endTime: "13:00", isAvailable: false, reason: "Lunch Break" },
      { facultyId: faculty1.id, day: "thursday", startTime: "13:00", endTime: "15:00", isAvailable: false, reason: "Committee Meeting" },
      { facultyId: faculty1.id, day: "thursday", startTime: "15:00", endTime: "17:00", isAvailable: true, reason: "Office Hours" }
    ];
    
    const fridaySlots: InsertTimeSlot[] = [
      { facultyId: faculty1.id, day: "friday", startTime: "8:00", endTime: "10:00", isAvailable: true, reason: "Office Hours" },
      { facultyId: faculty1.id, day: "friday", startTime: "10:00", endTime: "12:00", isAvailable: false, reason: "Teaching CS 101" },
      { facultyId: faculty1.id, day: "friday", startTime: "12:00", endTime: "13:00", isAvailable: false, reason: "Lunch Break" },
      { facultyId: faculty1.id, day: "friday", startTime: "13:00", endTime: "14:00", isAvailable: true, reason: "Office Hours" },
      { facultyId: faculty1.id, day: "friday", startTime: "14:00", endTime: "16:00", isAvailable: false, reason: "Research Time" },
      { facultyId: faculty1.id, day: "friday", startTime: "16:00", endTime: "17:00", isAvailable: true, reason: "Office Hours" }
    ];
    
    // Create slots for faculty2 (Michael Smith)
    const faculty2MondaySlots: InsertTimeSlot[] = [
      { facultyId: faculty2.id, day: "monday", startTime: "8:00", endTime: "10:00", isAvailable: false, reason: "Teaching MATH 101" },
      { facultyId: faculty2.id, day: "monday", startTime: "10:00", endTime: "12:00", isAvailable: true, reason: "Office Hours" },
      { facultyId: faculty2.id, day: "monday", startTime: "12:00", endTime: "13:00", isAvailable: false, reason: "Lunch Break" },
      { facultyId: faculty2.id, day: "monday", startTime: "13:00", endTime: "15:00", isAvailable: false, reason: "Research Time" },
      { facultyId: faculty2.id, day: "monday", startTime: "15:00", endTime: "17:00", isAvailable: true, reason: "Office Hours" }
    ];
    
    // Add all slots
    const allSlots = [
      ...mondaySlots,
      ...tuesdaySlots,
      ...wednesdaySlots,
      ...thursdaySlots,
      ...fridaySlots,
      ...faculty2MondaySlots
    ];
    
    allSlots.forEach(slot => {
      const newSlot: TimeSlot = ensureNotUndefined({
        id: this.currentSlotId++,
        ...slot,
        reason: slot.reason || null
      });
      this.slots.set(newSlot.id, newSlot);
    });
  }

  async getFaculty(id: number): Promise<Faculty | undefined> {
    return this.faculties.get(id);
  }

  async getFacultyByName(name: string): Promise<Faculty | undefined> {
    const normalizedName = name.toLowerCase();
    return Array.from(this.faculties.values()).find(
      faculty => faculty.name.toLowerCase().includes(normalizedName)
    );
  }

  async getAllFaculty(): Promise<Faculty[]> {
    return Array.from(this.faculties.values());
  }

  async createFaculty(faculty: InsertFaculty): Promise<Faculty> {
    const id = this.currentFacultyId++;
    const newFaculty: Faculty = ensureNotUndefined({ 
      id, 
      ...faculty, 
      profileImage: faculty.profileImage || null 
    });
    this.faculties.set(id, newFaculty);
    return newFaculty;
  }

  async getTimeSlots(facultyId: number, day: string): Promise<TimeSlot[]> {
    return Array.from(this.slots.values()).filter(
      slot => slot.facultyId === facultyId && slot.day === day
    );
  }

  async createTimeSlot(timeSlot: InsertTimeSlot): Promise<TimeSlot> {
    const id = this.currentSlotId++;
    const newSlot: TimeSlot = ensureNotUndefined({ 
      id, 
      ...timeSlot, 
      reason: timeSlot.reason || null 
    });
    this.slots.set(id, newSlot);
    return newSlot;
  }

  async searchFacultyAvailability(search: SearchFaculty): Promise<FacultySearchResult | null> {
    const { facultyName, day, startTime, endTime } = search;
    
    // Find faculty by name
    const faculty = await this.getFacultyByName(facultyName);
    if (!faculty) return null;
    
    // Get all time slots for the faculty on the specified day
    const timeSlots = await this.getTimeSlots(faculty.id, day.toLowerCase());
    
    // Filter slots that fall within the specified time range
    const filteredSlots = timeSlots.filter(slot => {
      // A slot is within range if:
      // 1. it starts after or at the search start time AND before or at the search end time, OR
      // 2. it ends after or at the search start time AND before or at the search end time, OR
      // 3. it starts before the search start time AND ends after the search end time (it encompasses the search range)
      return (slot.startTime >= startTime && slot.startTime <= endTime) || 
             (slot.endTime >= startTime && slot.endTime <= endTime) ||
             (slot.startTime < startTime && slot.endTime > endTime);
    });
    
    // Separate available and unavailable slots
    const availableSlots = filteredSlots.filter(slot => slot.isAvailable);
    const unavailableSlots = filteredSlots.filter(slot => !slot.isAvailable);
    
    return {
      faculty,
      availableSlots,
      unavailableSlots
    };
  }

  async getTimeSlot(id: number): Promise<TimeSlot | undefined> {
    return this.slots.get(id);
  }

  async createAppointment(bookingData: BookAppointment): Promise<Appointment> {
    const { facultyId, timeSlotId, studentName, studentEmail, appointmentDate } = bookingData;
    
    // Generate a unique token for the appointment
    const token = generateToken();
    
    // Create new appointment
    const id = this.currentAppointmentId++;
    const appointment: Appointment = ensureNotUndefined({
      id,
      facultyId,
      timeSlotId,
      studentName,
      studentEmail,
      appointmentDate,
      notes: bookingData.notes || null,
      status: 'pending',
      token,
      createdAt: new Date()
    });
    
    // Store the appointment
    this.appointments.set(id, appointment);
    this.appointmentsByToken.set(token, id);
    
    return appointment;
  }
  
  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }
  
  async getAppointmentByToken(token: string): Promise<Appointment | undefined> {
    const appointmentId = this.appointmentsByToken.get(token);
    if (!appointmentId) return undefined;
    
    return this.appointments.get(appointmentId);
  }
  
  async updateAppointmentStatus(id: number, status: AppointmentStatus): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;
    
    // Update the appointment status
    const updatedAppointment: Appointment = {
      ...appointment,
      status,
      notes: appointment.notes,
      createdAt: appointment.createdAt
    };
    
    // Store the updated appointment
    this.appointments.set(id, updatedAppointment);
    
    return updatedAppointment;
  }
  
  getAllAppointments(): Appointment[] {
    return Array.from(this.appointments.values());
  }
}