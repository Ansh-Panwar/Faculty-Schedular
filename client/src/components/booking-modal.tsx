import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TimeSlot, BookAppointment } from '@shared/schema';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatTime, capitalizeFirstLetter } from '@/lib/utils';
import { useBookAppointment } from '@/hooks/use-api';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';

// Booking form schema with zod validation
const bookingFormSchema = z.object({
  studentName: z.string().min(2, "Name must be at least 2 characters").max(100),
  studentEmail: z.string().email("Please enter a valid email address"),
  appointmentDate: z.date({
    required_error: "Please select a date for your appointment",
  }),
  notes: z.string().optional(),
});

// Type for the form values
type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  facultyId: number;
  facultyName: string;
  facultyImage: string | null;
  timeSlot: TimeSlot;
  day: string;
  onSuccess: () => void;
}

export default function BookingModal({
  isOpen,
  onClose,
  facultyId,
  facultyName,
  facultyImage,
  timeSlot,
  day,
  onSuccess
}: BookingModalProps) {
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  // Setup form with validation
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      studentName: '',
      studentEmail: '',
      notes: '',
    },
  });

  // Book appointment mutation
  const bookAppointment = useBookAppointment();

  // Handle form submission
  const onSubmit = (values: BookingFormValues) => {
    // Convert form values to the API expected format
    const bookingData: BookAppointment = {
      facultyId,
      timeSlotId: timeSlot.id,
      studentName: values.studentName,
      studentEmail: values.studentEmail,
      appointmentDate: format(values.appointmentDate, 'yyyy-MM-dd'),
      notes: values.notes,
    };

    bookAppointment.mutate(bookingData, {
      onSuccess: () => {
        form.reset();
        onSuccess();
      },
      onError: (error) => {
        console.error("Booking error:", error);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">Book Appointment</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center mb-4">
            <Avatar className="w-12 h-12 mr-4 border-2 border-primary/20">
              <AvatarImage src={facultyImage || undefined} alt={facultyName} />
              <AvatarFallback>{getInitials(facultyName)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-gray-900">{facultyName}</p>
              <p className="text-sm text-gray-600">
                {capitalizeFirstLetter(day)}, {formatTime(timeSlot.startTime)} - {formatTime(timeSlot.endTime)}
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md text-sm mb-6">
            <p className="text-gray-600">
              Please provide your information to book this appointment. The faculty member will receive your request and send a confirmation email once approved.
            </p>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="studentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="studentEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="appointmentDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Appointment Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Briefly describe the purpose of your appointment"
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button 
                  type="submit"
                  disabled={bookAppointment.isPending}
                >
                  {bookAppointment.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    'Book Appointment'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
