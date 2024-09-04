"use client";

import { useEffect, useState } from "react";
import { FaEye, FaEyeSlash, FaCopy, FaTrash } from "react-icons/fa";
import nacl from "tweetnacl";
import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import { derivePath } from "ed25519-hd-key";
import bs58 from "bs58";
import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Toaster, toast } from 'sonner';

interface Wallet {
  publicKey: string;
  privateKey: string;
}

export default function Home() {
  const [mnemonics, setMnemonics] = useState<string>("");
  const [mnemonicsInput, setMnemonicsInput] = useState<string>("");
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [walletsData, setWalletsdata] = useState<Wallet[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isDisabled, setIsDisabled] = useState<boolean>(false);
  const [visibility, setVisibility] = useState<any[]>([]);
  const [isClipboardAvailable, setIsClipboardAvailable] = useState(false);
  const [screenSize, setScreenSize] = useState<any>({
    width: undefined
    });

  const [count, setCount] = useState(0);

  useEffect(() => {
    const storedWalletsdata = localStorage.getItem("wallets");
    const storedMnemonic = localStorage.getItem("mnemonics");
    

    if (storedWalletsdata && storedMnemonic) {
      setMnemonics(JSON.parse(storedMnemonic));
      setWalletsdata(JSON.parse(storedWalletsdata));
      setIsDisabled(true);
    }

    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth
        });
    };

     // Add event listener for resize
     window.addEventListener('resize', handleResize);

     // Call handler right away so state gets updated with initial window size
     handleResize();
 
     // Remove event listener on cleanup
     return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && navigator?.clipboard) {
      setIsClipboardAvailable(true);
      setVisibility(new Array(walletsData.length).fill(false));
    }
  }, [walletsData]);

  const handleGenerate = async () => {
    // console.log(mnemonics);
    if (mnemonicsInput) {
      // console.log("already generated !");
      // let generatedmnemonic = generateMnemonic();
      // console.log(mnemonic);
      const seedBuffer = mnemonicToSeedSync(mnemonicsInput);

      //for solana
      const path = `m/44'/501'/0'/0'`;
      const { key: derivedSeed } = derivePath(path, seedBuffer.toString("hex"));

      const { secretKey } = nacl.sign.keyPair.fromSeed(derivedSeed);
      const keypair = Keypair.fromSecretKey(secretKey);

      let publicKeyEncoded: string;
      let privateKeyEncoded: string;

      privateKeyEncoded = bs58.encode(secretKey);
      publicKeyEncoded = keypair.publicKey.toBase58();

      if (privateKeyEncoded && publicKeyEncoded) {
        let updatedWallets: any = [
          ...walletsData,
          { publicKey: publicKeyEncoded, privateKey: privateKeyEncoded },
        ];
        // console.log(updatedWallets);
        setWalletsdata(updatedWallets);
        setMnemonics(mnemonicsInput);
        localStorage.setItem("wallets", JSON.stringify(updatedWallets));
        localStorage.setItem("mnemonics", JSON.stringify(mnemonicsInput));
        toast.success('Keypair Generated Successfully !',{
          duration: 2000,
        });
        setIsDisabled(true);
      }
    } else {
      let generatedmnemonic = generateMnemonic();
      // console.log(mnemonic);
      const seedBuffer = mnemonicToSeedSync(generatedmnemonic);

      //for solana
      const path = `m/44'/501'/0'/0'`;
      const { key: derivedSeed } = derivePath(path, seedBuffer.toString("hex"));

      const { secretKey } = nacl.sign.keyPair.fromSeed(derivedSeed);
      const keypair = Keypair.fromSecretKey(secretKey);

      let publicKeyEncoded: string;
      let privateKeyEncoded: string;

      privateKeyEncoded = bs58.encode(secretKey);
      publicKeyEncoded = keypair.publicKey.toBase58();

      if (privateKeyEncoded && publicKeyEncoded) {
        let updatedWallets: any = [
          ...walletsData,
          { publicKey: publicKeyEncoded, privateKey: privateKeyEncoded },
        ];
        // console.log(updatedWallets);
        setWalletsdata(updatedWallets);
        setMnemonics(generatedmnemonic);
        localStorage.setItem("wallets", JSON.stringify(updatedWallets));
        localStorage.setItem("mnemonics", JSON.stringify(generatedmnemonic));
        toast.success('SEED & Keypair Generated Successfully !', {
          duration: 2000,
        });
        setIsDisabled(true);
      }
    }
  };

  const handleAddWallet = () => {
    if (mnemonics) {
      const seed = mnemonicToSeedSync(mnemonics);
      // let a = [];
      const path = `m/44'/501'/${walletsData.length}'/0'`;
      const derivedSeed = derivePath(path, seed.toString("hex")).key;

      let secret = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;

      let publicKey = Keypair.fromSecretKey(secret).publicKey.toBase58();

      const updatedWallets: Wallet[] = [
        ...walletsData,
        { publicKey: publicKey, privateKey: bs58.encode(secret) },
      ];
      // setWallets(updatedWallets);

      setWalletsdata(updatedWallets);

      localStorage.setItem("wallets", JSON.stringify(updatedWallets));
      toast.success('Added !', {
        duration: 1000,
      });
      // notifySuccess('Added!')
      // if (typeof window !== "undefined") {
      // localStorage.setItem("mnemonic", mnemonics);
      // setMnemonics(mnemonics);
      // }
    }
    else{
      toast.error('Please Generate the SEED First', {
        duration: 1000,
      });
    }
    
  };

  const toggleVisibility = (index: number) => {
    const updatedVisibility: any[] = [...visibility];
    updatedVisibility[index] = !updatedVisibility[index];
    setVisibility(updatedVisibility);
  };

  const removeItem = (index: number) => {
    const updatedItems = walletsData.filter((_, i) => i !== index);

    localStorage.setItem("wallets", JSON.stringify(updatedItems));

    setWalletsdata(updatedItems);
    toast.error('Deleted !', {
      duration: 1000,
    });

    // notifySuccess('Deleted!');
  };

  const handleCopy = async (textToCopy: string) => {
    if (isClipboardAvailable) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 1000);
        toast.success('Copied !', {
          duration: 1000,
        });
        // notifySuccess("Copied");
      } catch (err) {
        console.error("Failed to copy text:", err);
        toast.error('Failed to copy text', {
          duration: 1000,
        });
      }
    }
  };

  const handleDeleteAll = () => {
    // if (typeof window !== "undefined") {
      // localStorage.removeItem('data');
      // if(!keypair){
        // notifyError('Nothing to Delete !')
      // }
      // if(keypair){
        // notifyError('Nothing to Delete !')
      // }
      if(walletsData.length == 0){
        toast.error('Nothing to Delete !', {
          duration: 1000,
        });
      }
      else{
        localStorage.removeItem('wallets');
        localStorage.removeItem('mnemonics');
        setWalletsdata([]);
        setMnemonics('');
        setIsDisabled(false);
        setMnemonicsInput('');
        toast.success('Deleted Successfully', {
          duration: 2000
        });
      }
      // setCount(0);

    // }
    
  };
  return (
    <div className="container md:w-3/4 lg:w-4/5 mx-auto">
            <Toaster position="top-right"/>
      <div className="border-b-2 border-gray-700">
        <div className="flex flex-col items-center p-5">
          <h1 className="text-3xl text-center p-5 my-3 md:text-4xl lg:text-6xl">Mnemonics Wallet</h1>
          <input
            type="text"
            id="success"
            // className= "bg-transparent  focus:outline-none focus:ring-0 focus:border-gray-100 border border-gray-500 text-sm rounded-lg mx-auto block lg:w-3/4 p-2.5"
            className="bg-transparent focus:outline-none border border-gray-500 focus:border-gray-100 text-xs rounded-lg p-2.5 my-1 w-3/4 lg:text-sm" 
            value={mnemonicsInput ? mnemonicsInput : ""}
            placeholder={isDisabled
               ? "Your Seed is already generated, click Add Wallet to add one more keypair" : "Generate to get SEED, else paste here"}
            onChange={(e) => setMnemonicsInput(e.target.value)}
            disabled={isDisabled}
          />
          <button
            type="button"
            className={ isDisabled ? "text-xl border border-gray-500 mt-5 px-5 text-black rounded-sm bg-gray-200" : "text-xl border border-gray-500 mt-5 px-5 text-black rounded-sm bg-gray-200 hover:bg-transparent hover:text-white"}
            onClick={handleGenerate}
            disabled={isDisabled}
          >
            {mnemonics ? "Generated !" : "Generate"}
          </button>          
        </div>
      </div>
      <div className="border-b-2 border-gray-700 py-3 m-3">
  <div>
    <div className="flex justify-between">
      <h1>Secret Key</h1>
      <div className="flex">
        {(isOpen && mnemonics) && (
          <button
            className="text-gray-600 hover:text-white"
            onClick={() => handleCopy(mnemonics)}
          >
            <FaCopy size={20} />
          </button>
        )}
        <button
          className="flex items-center bg-transparent text-white px-2 py-2 rounded"
          onClick={
            mnemonics
              ? () => setIsOpen(!isOpen)
              : () =>
                  toast.error('Please Generate the SEED First', {
                    duration: 1000,
                  })
          }
        >
          <svg
            className={`w-5 h-5 ml-2 transform transition-transform duration-300 ${
              mnemonics && isOpen ? 'rotate-180' : 'rotate-0'
            }`}
            fill="none"
            stroke={isOpen ? 'white' : 'gray'}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            ></path>
          </svg>
        </button>
      </div>
    </div>
    <div
      className={`transition-all duration-500 ease-in-out overflow-hidden ${
        isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}
      style={{
        transitionProperty: 'max-height, opacity',
      }}
    >
      {isOpen && mnemonics && (
        <div className="grid grid-cols-4 gap-4 justify-items-center align-middle py-10">
          {mnemonics.split(' ').map((item, index) => (
            <div
              key={index}
              className="border-x border-y p-3 border-gray-700 w-full flex justify-center"
            >
              <p>{item}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
</div>

      <div className="border-b-2 border-gray-700 py-3 m-3">
        <div className="flex justify-between p-2 h-9">
          <div className="">
            <h1>Keypairs</h1>
          </div>
          <div className="flex">
            <div className="max-w-full mr-0">
              <button
                type="button"
                className="max-w-full bg-gray-700  text-white-900 hover:bottom-2 font-normal rounded-sm text-sm px-5 me-2 py-1 dark:hover:bg-transparent dark:hover:border-y-2"
                onClick={handleAddWallet}
              >
                Add Wallet
              </button>
            </div>
            <div>
              <button
                type="button"
                className="max-w-full bg-red-900  text-white-900 hover:bottom-2 font-normal rounded-sm text-sm px-5 me-2 py-1  dark:hover:bg-transparent dark:hover:border-y-2"
                onClick={handleDeleteAll}
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
        <div>
          {walletsData?.map((item, key) => {
            return (
              <div className="bg-transparent border-2  rounded-lg shadowbg-blue-800 dark:border-gray-700 mt-5 p-4">
                <div className="flex justify-between">
                  <h5 className="text-md font-bold tracking-tight dark:text-white">
                    Wallet {key + 1}
                  </h5>
                  {/* <div>
                    Balance: {d(item.publickey)}
                  </div> */}
                  <button
                    onClick={() => removeItem(key)}
                    className="flex items-center py-2"
                  >
                    <FaTrash className=" text-red-800 text-sm hover:text-white" />
                  </button>
                </div>
                <div className="mb-3 text-gray-400">
                  <h3>Public Key:</h3>
                  <div className="text-xs text-gray-700 flex justify-between">
                    <div>
                      {(screenSize.width <= 640) ? item.publicKey.slice(0,30) + '...' : item.publicKey} 
                    </div>
                    <div>
                      <button
                        className="text-gray-600 hover:text-white"
                        onClick={() => handleCopy(item.publicKey)}
                      >
                        <FaCopy size={15} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mb-3 font-normal text-gray-400">
                  <h3>Private Key:</h3>
                  <span className="text-xs text-gray-700 flex justify-between">
                    <div>
                      {visibility[key]
                        ? (screenSize.width <= 640 ) ? item.privateKey.slice(0, 30) + "..." : item.privateKey
                        : (screenSize.width <= 640 ) ? "*".repeat(item.privateKey.length-50) + "..." : "*".repeat(item.privateKey.length)}
                    </div>
                    <div>
                      <button
                        className="text-gray-600 hover:text-white px-2"
                        onClick={() => toggleVisibility(key)}
                      >
                        {visibility[key] ? (
                          <FaEyeSlash className="text-gray-400 hover:text-white" size={15} />
                        ) : (
                          <FaEye size={15} />
                        )}
                      </button>
                      <button
                        className="text-gray-600 hover:text-gray-900"
                        onClick={() => handleCopy(item.privateKey)}
                      >
                        <FaCopy size={15} />
                      </button>
                    </div>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
