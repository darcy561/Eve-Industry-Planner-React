import React from "react";
import { IndustryESICardActive } from "./Api Job Card/manufacturingCardActive";
import { IndustryESICardComplete } from "./Api Job Card/manufacturingCardComplete";
import { MeResearchESICardActive } from "./Api Job Card/meResearchActive";
import { TeResearchESICardActive } from "./Api Job Card/teResearchActive";
import { ReactionESICardComplete } from "./Api Job Card/reactionCardComplete";
import { ReactionESICardActive } from "./Api Job Card/reactionCardActive";
import { BpCopyESICardActive } from "./Api Job Card/bpCopyActive";
import { InventionESICardActive } from "./Api Job Card/InventionCardActive";

export function ApiJobCardSorter({ job }) {
  switch (job.activity_id) {
    case 1:
      switch (job.status) {
        case "active":
          return <IndustryESICardActive job={job} />;
        case "delivered":
          return <IndustryESICardComplete job={job} />;
        default:
          return null;
      }
    case 3:
      switch (job.status) {
        case "active":
          return <TeResearchESICardActive job={job} />;
        default:
          return null;
      }
    case 4:
      switch (job.status) {
        case "active":
          return <MeResearchESICardActive job={job} />;
        default:
          return null;
      }
    case 5:
      switch (job.status) {
        case "active":
          return <BpCopyESICardActive job={job} />;
        default:
          return null;
      }
    case 8:
      switch (job.status) {
        case "active":
          return <InventionESICardActive job={job} />;
        default:
          return null;
      }
    case 9:
      switch (job.status) {
        case "active":
          return <ReactionESICardActive job={job} />;
        case "delivered":
          return <ReactionESICardComplete job={job} />;
        default:
          return null;
      }
    default:
      return null;
  }
}
