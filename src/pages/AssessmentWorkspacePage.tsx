import { AssessmentWorkspaceView } from "@/features/assessmentWorkspace/AssessmentWorkspaceView";

export function AssessmentWorkspacePage({ assessmentId }: { assessmentId: string }) {
  return <AssessmentWorkspaceView assessmentId={assessmentId} />;
}