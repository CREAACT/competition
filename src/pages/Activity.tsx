import { Card } from "@/components/ui/card";
import { UserActivityChart } from "@/components/UserActivityChart";
import { UserSearch } from "@/components/UserSearch";

export function Activity() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Activity</h1>
      <div className="grid gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">User Activity</h2>
          <UserActivityChart />
        </Card>
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">User Search</h2>
          <UserSearch />
        </Card>
      </div>
    </div>
  );
}