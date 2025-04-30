import { useState } from 'react';
import { Faculty, TimeSlot } from '@shared/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Mail, MapPin } from 'lucide-react';
import { capitalizeFirstLetter } from '@/lib/utils';
import TimeSlotComponent from '@/components/time-slot';

interface FacultyCardProps {
  faculty: Faculty;
  availableSlots: TimeSlot[];
  unavailableSlots: TimeSlot[];
  day: string;
  onBookClick: (timeSlot: TimeSlot) => void;
}

export default function FacultyCard({ 
  faculty, 
  availableSlots, 
  unavailableSlots, 
  day,
  onBookClick 
}: FacultyCardProps) {
  const [isTimeSlotsVisible, setIsTimeSlotsVisible] = useState(true);

  // Get faculty initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  const toggleTimeSlots = () => {
    setIsTimeSlotsVisible(!isTimeSlotsVisible);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Faculty Info Section */}
      <div className="p-6">
        <div className="flex flex-col md:flex-row">
          <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
            <Avatar className="w-24 h-24 border-2 border-primary/20">
              <AvatarImage 
                src={faculty.profileImage || undefined} 
                alt={faculty.name} 
                className="object-cover"
              />
              <AvatarFallback className="text-xl">{getInitials(faculty.name)}</AvatarFallback>
            </Avatar>
          </div>
          
          <div className="flex-grow">
            <h4 className="text-xl font-semibold text-gray-900">{faculty.name}</h4>
            <p className="text-gray-600">{faculty.title}</p>
            <p className="text-gray-600">{faculty.department}</p>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 flex items-center">
                  <Mail className="h-4 w-4 text-gray-400 mr-2" />
                  {faculty.email}
                </p>
                <p className="text-sm text-gray-600 flex items-center">
                  <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                  {faculty.officeLocation}
                </p>
              </div>
              
              <div className="flex items-center justify-end">
                <Button
                  variant="ghost"
                  className="text-primary hover:text-primary/90 font-medium text-sm"
                  onClick={toggleTimeSlots}
                >
                  <span>{isTimeSlotsVisible ? 'Hide Time Slots' : 'View Available Time Slots'}</span>
                  {isTimeSlotsVisible ? 
                    <ChevronUp className="ml-1 h-4 w-4" /> :
                    <ChevronDown className="ml-1 h-4 w-4" />
                  }
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Time Slots Section */}
      {isTimeSlotsVisible && (
        <div className="bg-gray-50 p-6 border-t border-gray-200">
          <h5 className="text-md font-medium text-gray-900 mb-4">
            {capitalizeFirstLetter(day)} Time Slots
          </h5>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Available Slots */}
            {availableSlots.map((slot) => (
              <TimeSlotComponent
                key={slot.id}
                timeSlot={slot}
                isAvailable={true}
                onBookClick={() => onBookClick(slot)}
              />
            ))}
            
            {/* Unavailable Slots */}
            {unavailableSlots.map((slot) => (
              <TimeSlotComponent
                key={slot.id}
                timeSlot={slot}
                isAvailable={false}
              />
            ))}
            
            {/* No slots message */}
            {availableSlots.length === 0 && unavailableSlots.length === 0 && (
              <div className="col-span-full text-center py-6 text-gray-500">
                No time slots found for this day.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
