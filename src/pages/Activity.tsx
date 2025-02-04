import { UserActivityChart } from "@/components/UserActivityChart";
import { UserSearch } from "@/components/UserSearch";

export default function Activity() {
  return (
    <div className="space-y-6">
      <UserSearch />
      <UserActivityChart />
    </div>
  );
}