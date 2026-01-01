import React from 'react';
import { FaCheck, FaTimes, FaRobot, FaTrophy, FaUserNinja, FaCrown } from 'react-icons/fa';
import axios from 'axios';
import { serverUrl } from '../App'; 
import { toast } from 'react-toastify';
import { useSelector, useDispatch } from 'react-redux';
// import { setUserData } from '../redux/userSlice'; // Optional: if you want to update Redux immediately

const PricingCard = ({ title, price, features, icon, isRecommended, onBuy, userPlan }) => {
  const isCurrent = userPlan === title;
  
  return (
    <div className={`relative p-8 rounded-2xl border flex flex-col items-center transition-all duration-300 hover:scale-105 ${
        isRecommended 
        ? 'border-orange-500 bg-gradient-to-b from-orange-900/20 to-black shadow-[0_0_30px_rgba(255,69,0,0.2)]' 
        : 'border-gray-800 bg-black/40'
    }`}>
      {isRecommended && (
        <div className="absolute -top-4 bg-orange-600 text-white font-bold px-4 py-1 rounded-full text-xs uppercase tracking-wider shadow-lg">
          Most Popular
        </div>
      )}
      
      <div className={`text-5xl mb-6 ${isRecommended ? 'text-orange-500' : 'text-gray-600'}`}>
        {icon}
      </div>

      <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-wide">{title}</h3>
      <div className="mb-6 flex items-baseline">
        <span className="text-4xl font-black text-white">₹{price}</span>
        <span className="text-gray-500 ml-1">/mo</span>
      </div>

      <ul className="space-y-4 mb-8 w-full">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-3 text-sm">
            {f.included ? (
              <div className="p-1 rounded-full bg-green-500/20 text-green-500"><FaCheck size={10}/></div>
            ) : (
              <div className="p-1 rounded-full bg-gray-800 text-gray-600"><FaTimes size={10}/></div>
            )}
            <span className={!f.included ? 'text-gray-600' : 'text-gray-300'}>{f.text}</span>
          </li>
        ))}
      </ul>

      <button 
        onClick={() => onBuy(title)}
        disabled={isCurrent || price === 0}
        className={`w-full py-3 rounded-lg font-bold uppercase tracking-wider transition-all ${
            isCurrent 
            ? 'bg-gray-800 text-gray-500 cursor-default border border-gray-700'
            : isRecommended 
                ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-[0_0_20px_rgba(234,88,12,0.4)]' 
                : 'bg-white text-black hover:bg-gray-200'
        }`}
      >
        {isCurrent ? "Active Plan" : price === 0 ? "Get Started" : "Upgrade Now"}
      </button>
    </div>
  );
};

const PricingPage = () => {
  const { userData } = useSelector(state => state.user);
  const dispatch = useDispatch();

  const handlePayment = async (planType) => {
    if (!userData) return toast.error("Please login to upgrade!");

    try {
        // 1. Create Order
        const { data: order } = await axios.post(
            `${serverUrl}/api/payment/create-order`, 
            { planType }, 
            { withCredentials: true }
        );

        // 2. Open Razorpay Interface
        const options = {
            key: order.keyId,
            amount: order.amount,
            currency: order.currency,
            name: `Ranbhoomi ${planType}`,
            description: `Unlock ${planType} Powers`,
            order_id: order.orderId,
            handler: async (response) => {
                // 3. Verify on Backend
                try {
                    const verify = await axios.post(
                        `${serverUrl}/api/payment/verify-payment`, 
                        {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            planType: planType
                        }, 
                        { withCredentials: true }
                    );
                    
                    if (verify.data.success) {
                        toast.success(`Welcome to the ${planType} tier!`);
                        // Force reload to update User State (simplest way)
                        window.location.reload(); 
                    }
                } catch (err) {
                    toast.error("Payment Verification Failed");
                    console.error(err);
                }
            },
            theme: { color: "#ea580c" }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response){
            toast.error(response.error.description);
        });
        rzp.open();

    } catch (err) {
        console.error(err);
        toast.error("Could not initiate payment");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white py-20 px-4 flex flex-col items-center">
      <div className="text-center mb-16 max-w-2xl">
        <h1 className="text-5xl font-black text-white mb-4 tracking-tight">
          CHOOSE YOUR <span className="text-orange-600">WEAPON</span>
        </h1>
        <p className="text-gray-400 text-lg">
          Whether you are a scout or a gladiator, we have the right tools to prepare you for the battleground of coding interviews.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 max-w-7xl w-full px-4">
        {/* SCOUT (Free) */}
        <PricingCard 
          title="Free" 
          price={0} 
          icon={<FaUserNinja />}
          userPlan={userData?.subscriptionPlan}
          onBuy={() => {}}
          features={[
            { text: "3 AI Hints / Day", included: true },
            { text: "Participate in Public Contests", included: true },
            { text: "Standard Problem Set", included: true },
            { text: "Company Tags", included: false },
            { text: "Mock Interviews", included: false },
          ]}
        />

        {/* WARRIOR */}
        <PricingCard 
          title="Warrior" 
          price={499} 
          icon={<FaRobot />}
          isRecommended={true}
          userPlan={userData?.subscriptionPlan}
          onBuy={handlePayment}
          features={[
            { text: "Unlimited AI Assistant", included: true },
            { text: "Company Tags (Amazon/Google)", included: true },
            { text: "Premium Problem Archive", included: true },
            { text: "5 Peer Mock Interviews / Mo", included: true },
            { text: "Host Private Contests", included: false },
          ]}
        />

        {/* GLADIATOR */}
        <PricingCard 
          title="Gladiator" 
          price={999} 
          icon={<FaCrown />}
          userPlan={userData?.subscriptionPlan}
          onBuy={handlePayment}
          features={[
            { text: "Everything in Warrior", included: true },
            { text: "Host Private Contests", included: true },
            { text: "Unlimited Mock Interviews", included: true },
            { text: "Video Solutions", included: true },
            { text: "Legendary Profile Badge", included: true },
          ]}
        />
      </div>
    </div>
  );
};

export default PricingPage;