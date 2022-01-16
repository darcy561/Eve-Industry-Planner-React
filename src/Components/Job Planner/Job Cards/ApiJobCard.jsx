import React from "react";
import { IndustryESICardActive } from "./Api Job Card/manufacturingCardActive";
import { IndustryESICardComplete } from "./Api Job Card/manufacturingCardComplete";

export function ApiJobCard({ job }) {
  if (job.activity_id === 1) {
    if (job.status === "active") {
      return <IndustryESICardActive job={job} />;
    }
    if (job.status === "delivered") {
      return <IndustryESICardComplete job={job} />;
    }
  } else {
    return null;
  }
}
