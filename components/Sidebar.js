import 'bootstrap-icons/font/bootstrap-icons.css';

export default function Sidebar() {
  return (
    <div
      className="fixed top-0 left-0 h-screen w-[130px] bg-[#264653] text-white pt-5 z-50 flex flex-col items-center space-y-6"
    >
      <a
        href="/"
        className="flex flex-col items-center hover:bg-[#2a9d8f] px-4 py-3 w-full"
      >
        <i className="bi bi-house-door text-xl mb-1" />
        <span className="text-sm text-center">Shipping Bills</span>
      </a>

      <a
        href="/irm"
        className="flex flex-col items-center hover:bg-[#2a9d8f] px-4 py-3 w-full"
      >
        <i className="bi bi-speedometer2 text-xl mb-1" />
        <span className="text-sm text-center">IRM Details</span>
      </a>
    </div>
  );
}
