export default function DashboardLoading() {
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#832D90] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <div className="mt-6 bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold text-[#832D90] mb-2">Loading your dashboard...</h2>
            <p className="text-gray-600">Please wait while we prepare your personalized experience</p>
          </div>
        </div>
      </div>
    )
  }
  