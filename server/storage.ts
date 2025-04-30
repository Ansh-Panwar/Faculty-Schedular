import { MemStorage } from "@shared/storage";
import { 
  Faculty,
  InsertFaculty,
  TimeSlot,
  InsertTimeSlot,
  Appointment,
  InsertAppointment,
  BookAppointment,
  FacultySearchResult,
  SearchFaculty
} from "@shared/schema";

// Using the imported MemStorage implementation
class AppStorage extends MemStorage {
  // This extends the base MemStorage implementation provided in shared/storage.ts
  // All methods are inherited from the parent class
}

export const storage = new AppStorage();
export type IStorage = typeof storage;
