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
import { AuthToken } from "./Components/Auth/Auth-Login";
import { IsLoggedIn, Users } from "./Context/AuthContext";

function App() {
  return (
    <>
      <Router>
        <Header />
        <Switch>
          <IsLoggedIn>
          <Users>
              <SelectedPage>
                <JobSettingsTrigger>
                  <ActiveJob>
                    <JobArray>
                      <JobStatus>
                        <Route path="/home" exact component={Home} />
                        <Route
                          path="/jobplanner"
                          exact
                          component={JobPlanner}
                        />
                        <Route path="/auth/" exact component={AuthToken} />
                        <Route path="/itemtree" exact component={ItemTree} />
                      </JobStatus>
                    </JobArray>
                  </ActiveJob>
                </JobSettingsTrigger>
              </SelectedPage>
              </Users>
            </IsLoggedIn>
        </Switch>
      </Router>
    </>
  );
}

export default App;
