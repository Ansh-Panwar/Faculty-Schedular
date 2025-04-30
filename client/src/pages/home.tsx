import React, { useState } from 'react';
import SearchForm from '@/components/search-form';
import { FacultySearchResult, SearchFaculty } from '@shared/schema';
import { useSearchFaculty } from '@/hooks/use-api';
import FacultyCard from '@/components/faculty-card';
import BookingModal from '@/components/booking-modal';
import { TimeSlot } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

interface SelectedTimeSlotInfo {
  facultyId: number;
  facultyName: string;
  facultyImage: string | null;
  timeSlot: TimeSlot;
  day: string;
}

export default function Home() {
  const { toast } = useToast();
  const [searchResults, setSearchResults] = useState<FacultySearchResult | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<SelectedTimeSlotInfo | null>(null);
  
  const searchMutation = useSearchFaculty();

  const handleSearch = async (data: SearchFaculty) => {
    try {
      searchMutation.mutate(data, {
        onSuccess: (result) => {
          setSearchResults(result);
        },
        onError: (error) => {
          toast({
            title: "Search Failed",
            description: error.message || "Failed to search faculty availability. Please try again.",
            variant: "destructive"
          });
        }
      });
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleOpenBookingModal = (info: SelectedTimeSlotInfo) => {
    setSelectedTimeSlot(info);
    setIsBookingModalOpen(true);
  };

  const handleCloseBookingModal = () => {
    setIsBookingModalOpen(false);
  };

  const handleBookingSuccess = () => {
    setIsBookingModalOpen(false);
    toast({
      title: "Appointment Request Sent",
      description: "Your appointment request has been submitted. You'll receive an email confirmation once it's approved.",
      variant: "default"
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Heading */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Find and Book Faculty Appointments</h2>
        <p className="text-gray-600">Search for faculty members and book appointments during their available office hours.</p>
      </div>
      
      {/* Search Form */}
      <SearchForm onSearch={handleSearch} isLoading={searchMutation.isPending} />
      
      {/* Search Results */}
      <div className="space-y-8 mt-8">
        {searchMutation.isPending && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Searching for faculty members...</p>
          </div>
        )}
        
        {searchMutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error searching for faculty</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{searchMutation.error?.message || "There was an error processing your search. Please try again later."}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {searchMutation.isSuccess && searchResults && (
          <FacultyCard 
            faculty={searchResults.faculty}
            availableSlots={searchResults.availableSlots}
            unavailableSlots={searchResults.unavailableSlots}
            day={searchResults?.availableSlots[0]?.day || searchResults?.unavailableSlots[0]?.day || ""}
            onBookClick={(timeSlot) => handleOpenBookingModal({
              facultyId: searchResults.faculty.id,
              facultyName: searchResults.faculty.name,
              facultyImage: searchResults.faculty.profileImage,
              timeSlot,
              day: timeSlot.day
            })}
          />
        )}
        
        {searchMutation.isSuccess && !searchResults && (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-gray-100">
              <svg className="h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No faculty members found</h3>
            <p className="mt-2 text-gray-600">Try adjusting your search filters or search for a different faculty member.</p>
          </div>
        )}
      </div>
      
      {/* Booking Modal */}
      {selectedTimeSlot && (
        <BookingModal 
          isOpen={isBookingModalOpen}
          onClose={handleCloseBookingModal}
          facultyId={selectedTimeSlot.facultyId}
          facultyName={selectedTimeSlot.facultyName}
          facultyImage={selectedTimeSlot.facultyImage}
          timeSlot={selectedTimeSlot.timeSlot}
          day={selectedTimeSlot.day}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
}
