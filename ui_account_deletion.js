(() => {
function q(s){return document.querySelector(s)}
function qa(s){return document.querySelectorAll(s)}
function rnd(a){for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function lockScroll(x){document.body.style.overflow=x?"hidden":""}

let userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 22130261
let step = 1, modal, content

function openModal(){
  if(q("#del-modal")) q("#del-modal").remove()
  modal=document.createElement("div")
  modal.id="del-modal"
  modal.style="position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:9999"
  content=document.createElement("div")
  content.style="width:92%;max-width:420px;background:#1c1c1e;padding:20px;border-radius:14px;box-shadow:0 0 20px #000;color:#fff;font-size:15px;line-height:1.45"
  modal.appendChild(content)
  document.body.appendChild(modal)
  lockScroll(true)
}

function closeModal(){
  if(modal){modal.remove();lockScroll(false)}
}

function btn(txt,cls,cb){
  let b=document.createElement("button")
  b.textContent=txt
  b.className=cls
  b.style="width:100%;padding:12px;border-radius:10px;margin-top:10px;border:none;font-size:15px;background:#2c2c2e;color:#fff"
  if(cls==="danger"){b.style.background="#d32f2f"}
  b.onclick=cb
  return b
}

function draw(){
  openModal()
  content.innerHTML=""
  let title=document.createElement("div")
  title.style="font-weight:600;font-size:17px;margin-bottom:10px"
  let text=document.createElement("div")
  text.style="margin-bottom:15px;opacity:.9"
  let box=document.createElement("div")

  if(step===1){
    title.textContent="Delete SAFE Account?"
    text.innerHTML="Deleting your SAFE account is permanent and cannot be undone.<br><br>You may temporarily disable the bot via Telegram Settings instead of full deletion.<br><br>Are you sure you want to continue?"
    let arr=[
      {t:"Yes",s:"",v:()=>{step=2;draw()}},
      {t:"No",s:"",v:closeModal},
      {t:"Not sure",s:"",v:closeModal},
      {t:"Cancel",s:"",v:closeModal}
    ]
    rnd(arr).forEach(o=>box.appendChild(btn(o.t,o.s,o.v)))
  }

  if(step===2){
    title.textContent="Are you absolutely sure?"
    text.innerHTML="This action is irreversible. All metadata and logs associated with your SAFE account will be permanently erased."
    let arr=[
      {t:"Yes I'm sure",s:"",v:()=>{step=3;draw()}},
      {t:"No",s:"",v:closeModal},
      {t:"Yes",s:"",v:()=>{step=3;draw()}},
      {t:"I don't know",s:"",v:closeModal}
    ]
    rnd(arr).forEach(o=>box.appendChild(btn(o.t,o.s,o.v)))
  }

  if(step===3){
    title.textContent="Final confirmation"
    text.innerHTML=`To permanently delete your SAFE account, type the command below exactly as shown:<br><br><b>DELETE ${userId}</b>`
    let input=document.createElement("input")
    input.type="text"
    input.style="width:100%;padding:12px;border-radius:10px;font-size:15px;margin-top:10px;border:1px solid #444;background:#2c2c2e;color:#fff"
    let warn=document.createElement("div")
    warn.style="color:#f55;margin-top:8px;display:none;font-size:13px"
    warn.textContent="Incorrect command"

    let row=document.createElement("div")
    row.style="display:flex;gap:10px;margin-top:15px"

    let backBtn=btn("Back","",()=>{step=2;draw()})
    backBtn.style.flex="1"
    let confirmBtn=btn("Confirm deletion","danger",()=>{
      closeModal()
      alert("✔ Account deletion request sent.\n(After backend is connected, this will permanently remove user data.)")
    })
    confirmBtn.style.flex="1"
    confirmBtn.disabled=true
    confirmBtn.style.opacity=".4"

    input.oninput=()=>{
      if(input.value===`DELETE ${userId}`){
        warn.style.display="none"
        input.style.border="1px solid #4caf50"
        confirmBtn.disabled=false
        confirmBtn.style.opacity="1"
      } else {
        warn.style.display = input.value.length>0 ? "block" : "none"
        input.style.border="1px solid #d32f2f"
        confirmBtn.disabled=true
        confirmBtn.style.opacity=".4"
      }
    }

    box.appendChild(input)
    box.appendChild(warn)
    row.appendChild(backBtn)
    row.appendChild(confirmBtn)
    box.appendChild(row)
  }

  content.appendChild(title)
  content.appendChild(text)
  content.appendChild(box)
}

window.openAccountDeletionModal=()=>{step=1;draw()}

})();
