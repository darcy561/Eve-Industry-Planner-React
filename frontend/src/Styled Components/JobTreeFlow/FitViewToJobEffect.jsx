import { useEffect } from "react";
import { useReactFlow } from "@xyflow/react";

/**
 * Fits the viewport to one job.
 *
 * @param {Object} props
 * @param {string} props.jobID - The job to fit to.
 * @param {string} props.fitKey - Changes when the view should be fitted again: a
 *   fresh request for the same job, or the same request over a new layout.
 */
export default function FitViewToJobEffect({ jobID, fitKey }) {
  const { fitView, getNode } = useReactFlow();

  useEffect(() => {
    if (!jobID) return;
    const t = window.setTimeout(() => {
      const n = getNode(jobID);
      if (!n) return;
      fitView({
        nodes: [n],
        padding: 0.52,
        duration: 380,
        maxZoom: 0.88,
      });
    }, 80);
    return () => window.clearTimeout(t);
    // `fitKey` is here as the reason to run, not as something the run reads.
  }, [fitKey, jobID, fitView, getNode]);

  return null;
}
