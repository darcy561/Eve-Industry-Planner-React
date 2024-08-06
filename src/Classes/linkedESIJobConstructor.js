class LinkedESIJob {
    constructor(originalJob, owner) {
      this.status = originalJob.status;
      this.CharacterHash = owner.CharacterHash;
      this.runs = originalJob.runs;
      this.job_id = originalJob.job_id;
      this.completed_date = originalJob.completed_date || null;
      this.station_id = originalJob.facility_id;
      this.start_date = originalJob.start_date;
      this.end_date = originalJob.end_date;
      this.cost = originalJob.cost;
      this.blueprint_type_id = originalJob.blueprint_type_id;
      this.product_type_id = originalJob.product_type_id;
      this.activity_id = originalJob.activity_id;
      this.duration = originalJob.duration;
      this.blueprint_id = originalJob.blueprint_id;
      this.isCorp = originalJob.isCorp;
    }
}
  
export default LinkedESIJob