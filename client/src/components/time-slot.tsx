import { TimeSlot } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/utils';

interface TimeSlotProps {
  timeSlot: TimeSlot;
  isAvailable: boolean;
  onBookClick?: () => void;
}

export default function TimeSlotComponent({ timeSlot, isAvailable, onBookClick }: TimeSlotProps) {
  return (
    <div 
      className={`
        bg-white border rounded-md p-4 flex items-center shadow-sm
        ${isAvailable 
          ? 'border-green-200' 
          : 'border-red-200 opacity-75'
        }
      `}
    >
      <div 
        className={`
          w-3 h-3 rounded-full mr-3 flex-shrink-0
          ${isAvailable ? 'bg-green-500' : 'bg-red-500'}
        `}
      ></div>
      
      <div>
        <p className="font-medium text-gray-900">
          {formatTime(timeSlot.startTime)} - {formatTime(timeSlot.endTime)}
        </p>
        <p className="text-sm text-gray-600">{timeSlot.reason || 'No description'}</p>
      </div>
      
      <div className="ml-auto">
        {isAvailable ? (
          <Button 
            onClick={onBookClick}
            size="sm"
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            Book
          </Button>
        ) : (
          <span className="text-xs text-red-500 font-medium">Unavailable</span>
        )}
      </div>
    </div>
  );
}
