import { redirect } from "next/navigation";

/** «Biriktirish» endi «Guruh o'quvchilari» sahifasida (har qatorda guruhni almashtirish). */
export default function StudentAssignRedirect() {
  redirect("/education/groups/students");
}
