import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { toWei } from "thirdweb/utils";
import { useStateContext } from '../context';
import { money } from '../assets';
import { CustomButton, FormField, Loader } from '../components';
import { checkIfImage } from '../utils';
import { useEthPrice } from "../context/EthPriceContext";

const CreateCampaign = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { createCampaign } = useStateContext();
  const { ethPriceUSD, ethPriceINR } = useEthPrice();

  const [form, setForm] = useState({
    name: '',
    title: '',
    description: '',
    target: '',
    deadline: '',
    image: '',
    category: '',
  });

  const goalUSD =
    form.target && ethPriceUSD
      ? (Number(form.target) * ethPriceUSD).toFixed(2)
      : "0.00";

  const goalINR =
    form.target && ethPriceINR
      ? (Number(form.target) * ethPriceINR).toFixed(0)
      : "0";

  const handleFormFieldChange = (fieldName, e) => {
    setForm({ ...form, [fieldName]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const deadline = Math.floor(
      new Date(form.deadline).getTime() / 1000
    );

    const currentTime = Math.floor(Date.now() / 1000);

    console.log("Deadline:", deadline);
    console.log("Current Time:", currentTime);

    if (deadline <= currentTime) {
      alert("Deadline must be in the future");
      return;
    }

    checkIfImage(form.image, async (exists) => {
      if (exists) {
        try {
          setIsLoading(true);

          await createCampaign({
            ...form,
            deadline,
            target: toWei(form.target),
          });

          navigate('/');
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      } else {
        alert('Provide valid image URL');
        setForm({ ...form, image: '' });
      }
    });
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 dark:bg-[#13131a] px-4 py-10 transition-colors duration-300">

      {isLoading && <Loader />}

      <div className="w-full max-w-5xl bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg dark:shadow-none p-6 sm:p-10 transition-colors duration-300">

        {/* Header */}
        <div className="flex justify-center items-center py-4 mb-10 bg-gray-200 dark:bg-[#3a3a43] rounded-xl transition-colors duration-300">
          <h1 className="font-epilogue font-bold sm:text-[28px] text-[20px] text-gray-800 dark:text-white">
            Start a Campaign
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-8">

          <div className="flex flex-wrap gap-6">
            <FormField
              labelName="Your Name *"
              placeholder="John Doe"
              inputType="text"
              value={form.name}
              handleChange={(e) => handleFormFieldChange('name', e)}
            />
            <FormField
              labelName="Category *"
              placeholder="Education, Medical, Startup, Charity..."
              inputType="text"
              value={form.category}
              handleChange={(e) => handleFormFieldChange('category', e)}
            />
            <FormField
              labelName="Campaign Title *"
              placeholder="Write a title"
              inputType="text"
              value={form.title}
              handleChange={(e) => handleFormFieldChange('title', e)}
            />
          </div>

          <FormField
            labelName="Description *"
            placeholder="Write your campaign story"
            isTextArea
            value={form.description}
            handleChange={(e) => handleFormFieldChange('description', e)}
          />

          {/* Highlight Box */}
          <div className="w-full flex items-center p-6 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl shadow-md">
            <img src={money} alt="money" className="w-[45px] h-[45px] object-contain" />
            <h4 className="font-epilogue font-semibold text-[20px] text-white ml-6">
              You will get 100% of the raised amount
            </h4>
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="flex flex-col flex-1">
              <FormField
                labelName="Goal *"
                placeholder="0.50 ETH"
                inputType="number"
                value={form.target}
                handleChange={(e) => handleFormFieldChange('target', e)}
              />

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-1">
                ≈ ${goalUSD} USD | ₹ {goalINR} INR
              </p>
            </div>
            <FormField
              labelName="End Date *"
              placeholder="End Date"
              inputType="date"
              value={form.deadline}
              handleChange={(e) => handleFormFieldChange('deadline', e)}
            />
          </div>

          <FormField
            labelName="Campaign image *"
            placeholder="Place image URL of your campaign"
            inputType="url"
            value={form.image}
            handleChange={(e) => handleFormFieldChange('image', e)}
          />

          <div className="flex justify-center items-center mt-6">
            <CustomButton
              btnType="submit"
              title="Submit new campaign"
              styles="bg-gradient-to-r from-purple-500 to-indigo-600 hover:scale-105 transition-transform duration-300"
            />
          </div>

        </form>
      </div>
    </div>
  );
}

export default CreateCampaign;