import React from "react";
import { IndustryESICardActive } from "./Api Job Card/manufacturingCardActive";
import { IndustryESICardComplete } from "./Api Job Card/manufacturingCardComplete";
import { MeResearchESICardActive } from "./Api Job Card/meResearchActive";
import { TeResearchESICardActive } from "./Api Job Card/teResearchActive";
import { ReactionESICardComplete } from "./Api Job Card/reactionCardComplete";
import { ReactionESICardActive } from "./Api Job Card/reactionCardActive";
import { BpCopyESICardActive } from "./Api Job Card/bpCopyActive";

export function ApiJobCard({ job }) {
  if (job.activity_id === 1) {
    if (job.status === "active") {
      return <IndustryESICardActive job={job} />;
    }
    if (job.status === "delivered") {
      return <IndustryESICardComplete job={job} />;
    }
    if (job.status !== "active" && job.status !== "delivered") {
      return null;
    }
  }
  if (job.activity_id === 4) {
    if (job.status === "active") {
      return <MeResearchESICardActive job={job} />;
    } else return null;
  }
  if (job.activity_id === 3) {
    if (job.status === "active") {
      return <TeResearchESICardActive job={job} />;
    } else return null;
  }
  if (job.activity_id === 9) {
    if (job.status === "active") {
      return <ReactionESICardActive job={job} />;
    }
    if (job.status === "delivered") {
      return <ReactionESICardComplete job={job} />;
    }
    if (job.status !== "active" && job.status !== "delivered") {
      return null;
    }
  }
  if (job.activity_id === 5) {
    if (job.status === "active") {
      return <BpCopyESICardActive job={job} />;
    } else return null;
  }
}
