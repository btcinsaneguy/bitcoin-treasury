"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { SolariBoard } from "./components/solari/SolariBoard";
// import { useDisplayLength } from "./components/useDisplayLength";

function formatCurrency(number: number, locale = "en-US", currency = "USD") {
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 2,
    notation: "standard",
  });
  return formatter.format(number).replace("$", "USD ");
}

// Initial loading rows - defined outside component to avoid recreation
const getLoadingRows = (displayLength: number) => [
  { value: "", length: displayLength },
  { value: "", length: displayLength },
  { value: "", length: displayLength },
  { value: "", length: displayLength },
  { value: " Loading...", length: displayLength },
  { value: "", length: displayLength },
  { value: "", length: displayLength },
  { value: "", length: displayLength },
  { value: "", length: displayLength },
  { value: "", length: displayLength },
];

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // const displayLength = useDisplayLength();
  const displayLength = 20; // Fallback to a fixed length for simplicity

  const [bitcoinPrice, setBitcoinPrice] = useState(0);
  const previousPriceRef = useRef(0);
  const [priceDirection, setPriceDirection] = useState<string | null>(null);

  // 여러 주소를 저장하기 위한 배열로 변경
  const [bitcoinAddresses, setBitcoinAddresses] = useState<string[]>(() => {
    // URL에서 주소 파라미터 가져오기
    const addressParam = searchParams.get("addresses");
    return addressParam ? addressParam.split(",") : [""];
  });

  const [name, setName] = useState(searchParams.get("name") || "");
  const [holding, setHolding] = useState(0);
  const [holdingValue, setHoldingValue] = useState(0);
  const [currentRowIndex, setCurrentRowIndex] = useState(-1);
  const [inputError, setInputError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(20);
  const [isFetching, setIsFetching] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(!bitcoinAddresses[0]);
  // 잔액 업데이트를 위한 카운트다운 추가
  const [balanceCountdown, setBalanceCountdown] = useState(60);
  const [isBalanceFetching, setIsBalanceFetching] = useState(false);

  // Initialize loading rows immediately
  const loadingBoardRows = useMemo(
    () => getLoadingRows(displayLength),
    [displayLength]
  );

  // Update holding value when Bitcoin price changes
  useEffect(() => {
    setHoldingValue(bitcoinPrice * holding);
  }, [bitcoinPrice, holding]);

  // Format the display values
  const displayValue = error
    ? "Error"
    : `${formatCurrency(bitcoinPrice).toString()}${priceDirection ? ` ${priceDirection}` : ""
    }`;

  // 비트코인은 8자리 소수점까지 표시
  const holdingDisplay = error
    ? "Error"
    : `${holding.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 8 })}`;
  const holdingValueDisplay = error ? "Error" : formatCurrency(holdingValue);

  // Define the final board rows
  const finalBoardRows = useMemo(
    () => [
      { value: "", length: displayLength },
      { value: ` ${name || "WALLET"}`, length: displayLength },
      { value: "", length: displayLength },
      { value: " TOTAL HOLDINGS", length: displayLength },
      { value: ` BTC ${holdingDisplay}`, length: displayLength },
      { value: ` ${holdingValueDisplay}`, length: displayLength },
      { value: "", length: displayLength },
      { value: " BTC PRICE", length: displayLength },
      { value: ` ${displayValue}`, length: displayLength },
      { value: "", length: displayLength },
    ],
    [name, holdingValueDisplay, holdingDisplay, displayValue, displayLength]
  );

  // Current board rows based on loading state and animation progress
  const currentBoardRows = useMemo(() => {
    if (currentRowIndex === -1) {
      return loadingBoardRows;
    }

    return loadingBoardRows.map((row, index) => {
      if (index <= currentRowIndex) {
        return finalBoardRows[index];
      }
      return row;
    });
  }, [loadingBoardRows, finalBoardRows, currentRowIndex]);

  // Handle the row-by-row animation
  useEffect(() => {
    if (!isFetching && currentRowIndex === -1) {
      // Start the row animation after data is loaded
      const animateRows = () => {
        const interval = setInterval(() => {
          setCurrentRowIndex((prev) => {
            if (prev >= finalBoardRows.length - 1) {
              clearInterval(interval);
              return prev;
            }
            return prev + 1;
          });
        }, 300); // Adjust timing between each row update

        return () => clearInterval(interval);
      };

      // Small delay before starting the animation
      setTimeout(animateRows, 1000);
    }
  }, [isFetching, currentRowIndex, finalBoardRows.length]);

  // Check for URL parameters on initial load
  useEffect(() => {
    if (bitcoinAddresses[0]) {
      fetchBitcoinBalance();
    }
  }, []);

  // 1분마다 Bitcoin 주소 잔액 업데이트
  useEffect(() => {
    // 주소가 없거나 폼이 표시중이면 잔액 업데이트 안함
    if (isFormVisible || !bitcoinAddresses.some(addr => addr.trim() !== "")) {
      return;
    }

    // 잔액 업데이트 카운트다운 설정
    const balanceInterval = setInterval(() => {
      setBalanceCountdown((prev) => {
        if (prev <= 1) {
          // 1분이 지나면 잔액 업데이트 함수 호출
          updateAddressesBalance();
          return 60; // 카운트다운 초기화
        }
        return prev - 1;
      });
    }, 1000);

    // 컴포넌트 언마운트 시 인터벌 정리
    return () => {
      clearInterval(balanceInterval);
    };
  }, [isFormVisible, bitcoinAddresses]);

  // 주소 잔액만 업데이트하는 함수 (로딩 애니메이션 없이)
  const updateAddressesBalance = async () => {
    // 비어있지 않은 주소만 필터링
    const validAddresses = bitcoinAddresses.filter(addr => addr.trim() !== "");

    if (validAddresses.length === 0) {
      return;
    }

    setIsBalanceFetching(true);

    try {
      // 여러 주소를 |로 연결하여 한 번의 API 호출로 모든 잔액 조회
      const addressesParam = validAddresses.join("|");
      const response = await fetch(
        `https://blockchain.info/balance?active=${addressesParam}`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // 모든 주소의 잔액 합산
      let totalBalance = 0;
      let validAddressFound = false;

      validAddresses.forEach(address => {
        if (data[address]) {
          // Convert from satoshis to BTC (1 BTC = 100,000,000 satoshis)
          totalBalance += data[address].final_balance / 100000000;
          validAddressFound = true;
        }
      });

      if (validAddressFound) {
        setHolding(totalBalance);
      }
    } catch (err) {
      console.error("Failed to update Bitcoin balance:", err);
      // 자동 업데이트에서는 오류 메시지를 표시하지 않음
    }

    setIsBalanceFetching(false);
  };

  // Fetch Bitcoin price and manage countdown
  useEffect(() => {
    const fetchBitcoinPrice = async () => {
      setIsFetching(true);
      try {
        const response = await fetch(
          "https://pricing.bitcoin.block.xyz/current-price"
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const newPrice = parseFloat(data["amount"]);

        // Check if this is not the first fetch
        if (!isFetching) {
          // Compare with previous price to determine direction
          if (newPrice > previousPriceRef.current) {
            setPriceDirection("↑");
          } else if (newPrice < previousPriceRef.current) {
            setPriceDirection("↓");
          } else {
            setPriceDirection(null);
          }

          // Remove the direction indicator after 5 seconds (increased from 2 seconds)
          if (newPrice !== previousPriceRef.current) {
            setTimeout(() => {
              setPriceDirection(null);
            }, 2000);
          }
        } else {
          // Set initial price without showing direction
          setPriceDirection(null);
        }

        // Update prices
        const oldPrice = previousPriceRef.current;
        previousPriceRef.current = newPrice;
        setBitcoinPrice(newPrice);
      } catch (err) {
        console.error("Failed to fetch Bitcoin price:", err);
        setError("Failed to fetch Bitcoin price");
      }
      setIsFetching(false);
      setCountdown(20);
    };

    // Fetch immediately on load
    fetchBitcoinPrice();

    // Set up countdown interval
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchBitcoinPrice(); // Fetch when countdown reaches 0
          return 20; // Reset to 20 seconds
        }
        return prev - 1;
      });
    }, 1000);

    // Clean up intervals on component unmount
    return () => {
      clearInterval(countdownInterval);
    };
  }, []);

  // 주소 변경 처리
  const handleAddressChange = (index: number, value: string) => {
    const newAddresses = [...bitcoinAddresses];
    newAddresses[index] = value;
    setBitcoinAddresses(newAddresses);
  };

  // 주소 추가 처리
  const handleAddAddress = () => {
    setBitcoinAddresses([...bitcoinAddresses, ""]);
  };

  // 주소 삭제 처리
  const handleRemoveAddress = (index: number) => {
    if (bitcoinAddresses.length > 1) {
      const newAddresses = [...bitcoinAddresses];
      newAddresses.splice(index, 1);
      setBitcoinAddresses(newAddresses);
    }
  };

  // Update URL with name and addresses
  const updateURL = (name: string, addresses: string[]) => {
    const params = new URLSearchParams();
    if (name) params.set("name", name);

    // 비어있지 않은 주소만 URL에 포함
    const validAddresses = addresses.filter(addr => addr.trim() !== "");
    if (validAddresses.length > 0) {
      params.set("addresses", validAddresses.join(","));
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({ path: newUrl }, "", newUrl);
  };

  // Function to fetch Bitcoin address balances
  const fetchBitcoinBalance = async () => {
    // 비어있지 않은 주소만 필터링
    const validAddresses = bitcoinAddresses.filter(addr => addr.trim() !== "");

    if (validAddresses.length === 0) {
      setInputError("Please enter at least one Bitcoin address");
      return;
    }

    setInputError(null);
    setIsFetching(true);
    setCurrentRowIndex(-1);

    try {
      // Update URL with name and addresses
      updateURL(name, validAddresses);

      // Using blockchain.com API to fetch balance
      // 여러 주소를 |로 연결하여 한 번의 API 호출로 모든 잔액 조회
      const addressesParam = validAddresses.join("|");
      const response = await fetch(
        `https://blockchain.info/balance?active=${addressesParam}`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // 모든 주소의 잔액 합산
      let totalBalance = 0;
      let validAddressFound = false;

      validAddresses.forEach(address => {
        if (data[address]) {
          // Convert from satoshis to BTC (1 BTC = 100,000,000 satoshis)
          totalBalance += data[address].final_balance / 100000000;
          validAddressFound = true;
        }
      });

      if (validAddressFound) {
        setHolding(totalBalance);
        setIsFormVisible(false);
      } else {
        setInputError("Invalid addresses or no data available");
      }
    } catch (err) {
      console.error("Failed to fetch Bitcoin balance:", err);
      setInputError("Failed to fetch Bitcoin balance. Please check the addresses and try again.");
    }

    setIsFetching(false);
  };

  return (
    <div className="w-full h-full font-mono flex flex-col justify-center items-center">
      {isFormVisible ? (
        <div className="mb-8 p-6 rounded-lg bg-[#0e0d0d] max-w-md w-full">
          <h2 className="text-white text-xl mb-4 text-center">Bitcoin Balance Checker</h2>
          <div className="mb-4">
            <label className="block text-white text-sm mb-2">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 bg-[#1a1a1a] text-white border border-gray-700 rounded"
              placeholder="Enter your name"
            />
          </div>

          <div className="mb-4">
            <label className="block text-white text-sm mb-2">Bitcoin Addresses</label>
            {bitcoinAddresses.map((address, index) => (
              <div key={index} className="flex mb-2">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => handleAddressChange(index, e.target.value)}
                  className="flex-grow p-2 bg-[#1a1a1a] text-white border border-gray-700 rounded-l"
                  placeholder="Enter Bitcoin address"
                />
                <button
                  onClick={() => handleRemoveAddress(index)}
                  disabled={bitcoinAddresses.length <= 1}
                  className="px-3 bg-red-600 text-white rounded-none border border-gray-700 disabled:opacity-50 disabled:bg-gray-800"
                >
                  -
                </button>
                {index === bitcoinAddresses.length - 1 && (
                  <button
                    onClick={handleAddAddress}
                    className="px-3 bg-green-600 text-white rounded-r border border-gray-700"
                  >
                    +
                  </button>
                )}
              </div>
            ))}
          </div>

          {inputError && (
            <div className="text-red-500 text-sm mb-4">{inputError}</div>
          )}
          <button
            onClick={fetchBitcoinBalance}
            disabled={isFetching}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            {isFetching ? "Loading..." : "Check Balance"}
          </button>
        </div>
      ) : (
        <>
          <div className="relative p-4 rounded-lg bg-[#0e0d0d]">
            <SolariBoard rows={currentBoardRows} className="relative" />
          </div>

          <div className="flex flex-rows w-full justify-center opacity-0 transition-opacity duration-300 animate-fadeIn">
            {/* Status indicator */}
            <div className="flex items-center justify-center gap-2 text-zinc-400 mt-2 sm:mt-4">
              <div
                className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full ${isFetching || isBalanceFetching
                  ? "animate-pulse bg-yellow-500"
                  : "animate-pulse bg-green-500"
                  }`}
              ></div>
              <div className="text-xs sm:text-sm">
                {isFetching
                  ? "Fetching price..."
                  : isBalanceFetching
                    ? "Updating balance..."
                    : `Next price update: ${countdown}s | Next balance update: ${balanceCountdown}s`}
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-row space-x-4">
            <button
              onClick={() => {
                setIsFormVisible(true);
              }}
              className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded"
            >
              Check Another Address
            </button>
            <button
              onClick={() => {
                // URL 복사
                const currentURL = window.location.href;
                navigator.clipboard.writeText(currentURL)
                  .then(() => {
                    alert("URL이 클립보드에 복사되었습니다!");
                  })
                  .catch(err => {
                    console.error('URL 복사 실패:', err);
                  });
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded"
            >
              Share URL
            </button>
            <button
              onClick={() => {
                // 수동으로 잔액 업데이트
                updateAddressesBalance();
                setBalanceCountdown(60); // 카운트다운 초기화
              }}
              className="bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded"
            >
              Update Balance
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
