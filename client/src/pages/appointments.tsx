import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { type Appointment, type Faculty, type TimeSlot } from '@shared/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatTime } from '@/lib/utils';

interface AppointmentWithDetails extends Appointment {
  faculty?: Faculty;
  timeSlot?: TimeSlot;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/my-appointments'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/my-appointments');
        if (!response.ok) {
          throw new Error('Failed to fetch appointments');
        }
        return response.json();
      } catch (err) {
        console.error('Error fetching appointments:', err);
        return [];
      }
    }
  });
  
  useEffect(() => {
    if (data) {
      setAppointments(data);
    }
  }, [data]);
  
  function getStatusColor(status: string) {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Appointments</h1>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-1/3 mb-2" />
                <Skeleton className="h-3 w-1/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Appointments</h1>
        <Card className="bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">Error loading appointments. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Appointments</h1>
      
      {appointments.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">You don't have any appointments yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {appointments.map((appointment) => (
            <Card key={appointment.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{appointment.faculty?.name || 'Faculty Member'}</CardTitle>
                    <CardDescription>{appointment.faculty?.department || 'Department'}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(appointment.status || 'pending')}>
                    {appointment.status 
                      ? appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1) 
                      : 'Pending'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-1">
                  <p className="text-sm"><span className="font-medium">Date:</span> {formatDate(appointment.appointmentDate)}</p>
                  {appointment.timeSlot && (
                    <p className="text-sm"><span className="font-medium">Time:</span> {`${formatTime(appointment.timeSlot.startTime)} - ${formatTime(appointment.timeSlot.endTime)}`}</p>
                  )}
                  <p className="text-sm mt-2"><span className="font-medium">Student:</span> {appointment.studentName} ({appointment.studentEmail})</p>
                  {appointment.notes && (
                    <p className="text-sm mt-2"><span className="font-medium">Notes:</span> {appointment.notes}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}