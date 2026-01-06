import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { groupService } from "../services/groupService";

export const JoinGroup = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const joinGroup = async () => {
      if (!groupId) {
        setError("Invalid invite link");
        setLoading(false);
        return;
      }

      try {
        await groupService.joinGroup(groupId);
        // Redirect to dashboard after successful join
        navigate("/dashboard");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to join group");
        setLoading(false);
      }
    };

    joinGroup();
  }, [groupId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Joining group...</h2>
          <p className="text-gray-600">Please wait</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md p-6 border-2 border-gray-800 bg-white">
          <h2 className="text-2xl font-semibold mb-4 text-red-600">
            Error Joining Group
          </h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-2 border border-gray-800 bg-white hover:bg-gray-50"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return null;
};
