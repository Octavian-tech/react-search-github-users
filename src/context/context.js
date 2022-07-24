import React, { useState, useEffect } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);
  //request loading
  const [requests, setRequests] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState({ show: false, msg: "" });

  function toggleError(show = false, msg = "") {
    setError({ show, msg });
  }

  //check rate
  const checkRequest = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        let {
          rate: { remaining },
        } = data;

        setRequests(remaining);

        if (remaining === 0) {
          //throw an error
          toggleError(true, "Sorry you have exeded your hourly, rate limit");
        }
      })
      .catch((err) => console.log(err));
  };

  const searchGithubUser = async (user) => {
    console.log(user);
    // toggleError
    setIsLoading(true);
    const response = await axios(`${rootUrl}/users/${user}`).catch((err) =>
      console.log(err)
    );
    console.log(response);
    if (response) {
      setGithubUser(response.data);
      // setIsLoading(false);
      const { login, followers_url } = response.data;

      //  await axios(`${rootUrl}/users/${login}/repos?per_page=100`).then((response) =>
      //     setRepos(response.data)
      //   );

      // await  axios(`${followers_url}?per_page=100`).then((response) =>
      //     setFollowers(response.data)
      //   );

      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios(`${followers_url}?per_page=100`),
      ])
        .then((results) => {
          const [repos, followers] = results;
          const status = "fulfilled";
          if (repos.status === status) {
            setRepos(repos.value.data);
          }
          if (followers.status === status) {
            setFollowers(followers.value.data);
          }
          // setRepos(repos);
          // setFollowers(followers);
        })
        .catch((err) => console.log(err));

      // https://api.github.com/users/john-smilga/repos?per_page=100
      // https://api.github.com/users/john-smilga/followers
    } else {
      toggleError(true, "There is no user with that username");
      setIsLoading(false);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    checkRequest();
  }, []);

  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        requests,
        error,
        searchGithubUser,
        isLoading,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export { GithubContext, GithubProvider };
