import { AuthCard } from "@/components/auth/AuthCard";
import { FindSchoolForm } from "@/components/site/FindSchoolForm";

export default function FindSchoolPage() {
  return (
    <AuthCard
      title="Maktabga kirish"
      subtitle="Har maktabning o'z manzili bor — o'sha manzilda o'z login va parolingiz bilan kirasiz."
    >
      <FindSchoolForm />
    </AuthCard>
  );
}
