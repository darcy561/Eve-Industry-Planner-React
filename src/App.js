import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { Header } from "./Components/Home/Header";
import { Home } from "./Components/Home";
import { JobPlanner } from "./Components/Job Planner";
import { ItemTree } from "./Components/item Tree";
import {
  JobStatus,
  JobArray,
  ActiveJob,
  JobSettingsTrigger,
  SelectedPage,
} from "./Context/JobContext";

function App() {
  return (
    <>
      <Router>
        <Header />
        <Switch>
          <Route path="/home" component={Home} />
          <SelectedPage>
            <JobSettingsTrigger>
              <ActiveJob>
                <JobArray>
                  <JobStatus>
                    <Route path="/jobplanner" component={JobPlanner} />

                    <Route path="/itemtree" component={ItemTree} />
                  </JobStatus>
                </JobArray>
              </ActiveJob>
            </JobSettingsTrigger>
          </SelectedPage>
        </Switch>
      </Router>
    </>
  );
}

export default App;
