import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

export function UserActivityChart() {
  const [timeRange, setTimeRange] = useState(7); // Default to 7 days

  const { data: activityData } = useQuery({
    queryKey: ['userActivity', timeRange],
    queryFn: async () => {
      const startDate = startOfDay(subDays(new Date(), timeRange - 1));
      const endDate = endOfDay(new Date());

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_activity')
        .select('*')
        .eq('user_id', user.id)
        .gte('login_at', startDate.toISOString())
        .lte('login_at', endDate.toISOString())
        .order('login_at', { ascending: true });

      if (error) throw error;

      // Process data for chart
      const dailyActivity = data.reduce((acc: any, session) => {
        const date = format(new Date(session.login_at), 'MMM dd');
        const duration = session.duration_minutes || 0;
        
        acc[date] = (acc[date] || 0) + duration;
        return acc;
      }, {});

      return Object.entries(dailyActivity).map(([date, hours]) => ({
        date,
        hours: Number((Number(hours) / 60).toFixed(1))
      }));
    }
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Activity History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activityData || []}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="hours"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}