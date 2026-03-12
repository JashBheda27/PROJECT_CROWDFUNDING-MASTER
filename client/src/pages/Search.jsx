import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStateContext } from "../context";
import { FundCard } from "@/components";

const Search = () => {

  const { query } = useParams();
  const navigate = useNavigate();
  const { getCampaigns } = useStateContext();

  const [results, setResults] = useState([]);

  useEffect(() => {

    const fetchCampaigns = async () => {

      const data = await getCampaigns();

      if (!query) {
        setResults([]);
        return;
      }

      const search = query.toLowerCase();

      const filtered = data.filter((c) =>
        c.title?.toLowerCase().includes(search) ||
        c.description?.toLowerCase().includes(search)
      );

      setResults(filtered);

    };

    fetchCampaigns();

  }, [query, getCampaigns]);

  return (
    <div className="p-6">

      <h2 className="text-2xl font-semibold mb-6">
        Search Results for "{query}"
      </h2>

      {results.length === 0 && (
        <p className="text-gray-400">
          No campaigns found
        </p>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">

        {results.map((campaign, index) => (

          <FundCard
            key={index}
            owner={campaign.owner}
            title={campaign.title}
            description={campaign.description}
            target={campaign.target}
            category={campaign.category}
            status={campaign.status}
            deadline={campaign.deadline}
            amountCollected={campaign.amountCollected}
            image={campaign.image}
            handleClick={() =>
              navigate(`/campaign-details/${index}`, {
                state: campaign,
              })
            }
          />

        ))}

      </div>

    </div>
  );
};

export default Search;