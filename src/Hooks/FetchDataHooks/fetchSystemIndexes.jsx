import { getToken } from "firebase/app-check";
import { appCheck } from "../../firebase";

export async function fetchSystemIndexes(systemIndexInput) {
  let URL = `${import.meta.env.VITE_APIURL}/systemindexes`;
  const isInputArray = Array.isArray(systemIndexInput);
  const appCheckToken = await getToken(appCheck, true);

  if (!isInputArray) {
    URL += `/${systemIndexInput}`;
  }

  if (!systemIndexInput) {
    return {};
  }

  const response = await fetch(URL, {
    method: isInputArray ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Firebase-AppCheck": appCheckToken.token,
      //   accountID: parentUser.accountID,
      appVersion: __APP_VERSION__,
    },
    body: isInputArray
      ? JSON.stringify({
          idArray: [...systemIndexInput],
        })
      : undefined,
  });

  if (response.status !== 200) {
    return {};
  }
  const responseData = await response.json();


  if (Array.isArray(responseData)) {
    let returnObject = {};
    responseData.forEach((entry) => {
      returnObject[entry.solar_system_id] = entry;
    });
    return returnObject;
  }
  return { [responseData.solar_system_id]: responseData };
}
