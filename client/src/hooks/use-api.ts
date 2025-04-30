import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { 
  Faculty, 
  TimeSlot, 
  SearchFaculty,
  FacultySearchResult,
  BookAppointment,
  Appointment 
} from "@shared/schema";

// API hooks for faculty operations
export function useGetAllFaculty() {
  return useQuery<Faculty[]>({ 
    queryKey: ['/api/faculty']
  });
}

export function useGetFaculty(id: number) {
  return useQuery<Faculty>({ 
    queryKey: ['/api/faculty', id],
    enabled: !!id
  });
}

export function useGetTimeSlots(facultyId: number, day: string) {
  return useQuery<TimeSlot[]>({ 
    queryKey: ['/api/faculty', facultyId, 'time-slots', day],
    enabled: !!facultyId && !!day
  });
}

// Search faculty hook
export function useSearchFaculty() {
  return useMutation<FacultySearchResult, Error, SearchFaculty>({
    mutationFn: async (searchData: SearchFaculty) => {
      const response = await apiRequest('POST', '/api/faculty/search', searchData);
      return response.json();
    },
  });
}

// Book appointment hook
export function useBookAppointment() {
  return useMutation<Appointment, Error, BookAppointment>({
    mutationFn: async (bookingData: BookAppointment) => {
      const response = await apiRequest('POST', '/api/appointments', bookingData);
      return response.json();
    },
    onSuccess: () => {
      // No specific queries to invalidate since this creates a new appointment
      // We don't have a getAppointments endpoint to invalidate
    }
  });
}
