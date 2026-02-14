import{u as k,v as G,w as q,x as O,y as c,z as N,A as M,O as me,B as A,E as ee,R as U,F as Je,G as K,H as D,I as dt,J as vi,W as on,K as bn,M as Qt,N as Qe,P as ni,Q as Oe,U as je,V as mn,X as vn,Y as yi}from"./index-Bdg2dMAI.js";import{n as u,c as S,o as E,r as P,U as de,e as xi,f as Ci,a as Ri}from"./index-CQeylr23.js";import{j as $i}from"./index-BcHMn9h1.js";import{r as Ii}from"./dijkstra-COg3n3zL.js";import"./index.browser.esm-CqxJUNI1.js";import"./index-BVXD2UO3.js";import"./signIn-DZjoRbp3.js";import"./adapter-Bfk1G53B.js";const Ei=k`
  :host {
    position: relative;
    background-color: var(--wui-color-gray-glass-002);
    display: flex;
    justify-content: center;
    align-items: center;
    width: var(--local-size);
    height: var(--local-size);
    border-radius: inherit;
    border-radius: var(--local-border-radius);
  }

  :host > wui-flex {
    overflow: hidden;
    border-radius: inherit;
    border-radius: var(--local-border-radius);
  }

  :host::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: inherit;
    border: 1px solid var(--wui-color-gray-glass-010);
    pointer-events: none;
  }

  :host([name='Extension'])::after {
    border: 1px solid var(--wui-color-accent-glass-010);
  }

  :host([data-wallet-icon='allWallets']) {
    background-color: var(--wui-all-wallets-bg-100);
  }

  :host([data-wallet-icon='allWallets'])::after {
    border: 1px solid var(--wui-color-accent-glass-010);
  }

  wui-icon[data-parent-size='inherit'] {
    width: 75%;
    height: 75%;
    align-items: center;
  }

  wui-icon[data-parent-size='sm'] {
    width: 18px;
    height: 18px;
  }

  wui-icon[data-parent-size='md'] {
    width: 24px;
    height: 24px;
  }

  wui-icon[data-parent-size='lg'] {
    width: 42px;
    height: 42px;
  }

  wui-icon[data-parent-size='full'] {
    width: 100%;
    height: 100%;
  }

  :host > wui-icon-box {
    position: absolute;
    overflow: hidden;
    right: -1px;
    bottom: -2px;
    z-index: 1;
    border: 2px solid var(--wui-color-bg-150, #1e1f1f);
    padding: 1px;
  }
`;var Re=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let he=class extends O{constructor(){super(...arguments),this.size="md",this.name="",this.installed=!1,this.badgeSize="xs"}render(){let e="xxs";return this.size==="lg"?e="m":this.size==="md"?e="xs":e="xxs",this.style.cssText=`
       --local-border-radius: var(--wui-border-radius-${e});
       --local-size: var(--wui-wallet-image-size-${this.size});
   `,this.walletIcon&&(this.dataset.walletIcon=this.walletIcon),c`
      <wui-flex justifyContent="center" alignItems="center"> ${this.templateVisual()} </wui-flex>
    `}templateVisual(){return this.imageSrc?c`<wui-image src=${this.imageSrc} alt=${this.name}></wui-image>`:this.walletIcon?c`<wui-icon
        data-parent-size="md"
        size="md"
        color="inherit"
        name=${this.walletIcon}
      ></wui-icon>`:c`<wui-icon
      data-parent-size=${this.size}
      size="inherit"
      color="inherit"
      name="walletPlaceholder"
    ></wui-icon>`}};he.styles=[G,q,Ei];Re([u()],he.prototype,"size",void 0);Re([u()],he.prototype,"name",void 0);Re([u()],he.prototype,"imageSrc",void 0);Re([u()],he.prototype,"walletIcon",void 0);Re([u({type:Boolean})],he.prototype,"installed",void 0);Re([u()],he.prototype,"badgeSize",void 0);he=Re([S("wui-wallet-image")],he);const Wi=k`
  :host {
    position: relative;
    border-radius: var(--wui-border-radius-xxs);
    width: 40px;
    height: 40px;
    overflow: hidden;
    background: var(--wui-color-gray-glass-002);
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--wui-spacing-4xs);
    padding: 3.75px !important;
  }

  :host::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: inherit;
    border: 1px solid var(--wui-color-gray-glass-010);
    pointer-events: none;
  }

  :host > wui-wallet-image {
    width: 14px;
    height: 14px;
    border-radius: var(--wui-border-radius-5xs);
  }

  :host > wui-flex {
    padding: 2px;
    position: fixed;
    overflow: hidden;
    left: 34px;
    bottom: 8px;
    background: var(--dark-background-150, #1e1f1f);
    border-radius: 50%;
    z-index: 2;
    display: flex;
  }
`;var ii=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};const It=4;let Xe=class extends O{constructor(){super(...arguments),this.walletImages=[]}render(){const e=this.walletImages.length<It;return c`${this.walletImages.slice(0,It).map(({src:n,walletName:i})=>c`
            <wui-wallet-image
              size="inherit"
              imageSrc=${n}
              name=${E(i)}
            ></wui-wallet-image>
          `)}
      ${e?[...Array(It-this.walletImages.length)].map(()=>c` <wui-wallet-image size="inherit" name=""></wui-wallet-image>`):null}
      <wui-flex>
        <wui-icon-box
          size="xxs"
          iconSize="xxs"
          iconcolor="success-100"
          backgroundcolor="success-100"
          icon="checkmark"
          background="opaque"
        ></wui-icon-box>
      </wui-flex>`}};Xe.styles=[q,Wi];ii([u({type:Array})],Xe.prototype,"walletImages",void 0);Xe=ii([S("wui-all-wallets-image")],Xe);const _i=k`
  button {
    column-gap: var(--wui-spacing-s);
    padding: 7px var(--wui-spacing-l) 7px var(--wui-spacing-xs);
    width: 100%;
    background-color: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-xs);
    color: var(--wui-color-fg-100);
  }

  button > wui-text:nth-child(2) {
    display: flex;
    flex: 1;
  }

  button:disabled {
    background-color: var(--wui-color-gray-glass-015);
    color: var(--wui-color-gray-glass-015);
  }

  button:disabled > wui-tag {
    background-color: var(--wui-color-gray-glass-010);
    color: var(--wui-color-fg-300);
  }

  wui-icon {
    color: var(--wui-color-fg-200) !important;
  }
`;var Y=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let V=class extends O{constructor(){super(...arguments),this.walletImages=[],this.imageSrc="",this.name="",this.tabIdx=void 0,this.installed=!1,this.disabled=!1,this.showAllWallets=!1,this.loading=!1,this.loadingSpinnerColor="accent-100"}render(){return c`
      <button ?disabled=${this.disabled} tabindex=${E(this.tabIdx)}>
        ${this.templateAllWallets()} ${this.templateWalletImage()}
        <wui-text variant="paragraph-500" color="inherit">${this.name}</wui-text>
        ${this.templateStatus()}
      </button>
    `}templateAllWallets(){return this.showAllWallets&&this.imageSrc?c` <wui-all-wallets-image .imageeSrc=${this.imageSrc}> </wui-all-wallets-image> `:this.showAllWallets&&this.walletIcon?c` <wui-wallet-image .walletIcon=${this.walletIcon} size="sm"> </wui-wallet-image> `:null}templateWalletImage(){return!this.showAllWallets&&this.imageSrc?c`<wui-wallet-image
        size="sm"
        imageSrc=${this.imageSrc}
        name=${this.name}
        .installed=${this.installed}
      ></wui-wallet-image>`:!this.showAllWallets&&!this.imageSrc?c`<wui-wallet-image size="sm" name=${this.name}></wui-wallet-image>`:null}templateStatus(){return this.loading?c`<wui-loading-spinner
        size="lg"
        color=${this.loadingSpinnerColor}
      ></wui-loading-spinner>`:this.tagLabel&&this.tagVariant?c`<wui-tag variant=${this.tagVariant}>${this.tagLabel}</wui-tag>`:this.icon?c`<wui-icon color="inherit" size="sm" name=${this.icon}></wui-icon>`:null}};V.styles=[q,G,_i];Y([u({type:Array})],V.prototype,"walletImages",void 0);Y([u()],V.prototype,"imageSrc",void 0);Y([u()],V.prototype,"name",void 0);Y([u()],V.prototype,"tagLabel",void 0);Y([u()],V.prototype,"tagVariant",void 0);Y([u()],V.prototype,"icon",void 0);Y([u()],V.prototype,"walletIcon",void 0);Y([u()],V.prototype,"tabIdx",void 0);Y([u({type:Boolean})],V.prototype,"installed",void 0);Y([u({type:Boolean})],V.prototype,"disabled",void 0);Y([u({type:Boolean})],V.prototype,"showAllWallets",void 0);Y([u({type:Boolean})],V.prototype,"loading",void 0);Y([u({type:String})],V.prototype,"loadingSpinnerColor",void 0);V=Y([S("wui-list-wallet")],V);var qe=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let Se=class extends O{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=N.state.connectors,this.count=M.state.count,this.isFetchingRecommendedWallets=M.state.isFetchingRecommendedWallets,this.unsubscribe.push(N.subscribeKey("connectors",e=>this.connectors=e),M.subscribeKey("count",e=>this.count=e),M.subscribeKey("isFetchingRecommendedWallets",e=>this.isFetchingRecommendedWallets=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const e=this.connectors.find(s=>s.id==="walletConnect"),{allWallets:n}=me.state;if(!e||n==="HIDE"||n==="ONLY_MOBILE"&&!A.isMobile())return null;const i=M.state.featured.length,o=this.count+i,t=o<10?o:Math.floor(o/10)*10,a=t<o?`${t}+`:`${t}`;return c`
      <wui-list-wallet
        name="All Wallets"
        walletIcon="allWallets"
        showAllWallets
        @click=${this.onAllWallets.bind(this)}
        tagLabel=${a}
        tagVariant="shade"
        data-testid="all-wallets"
        tabIdx=${E(this.tabIdx)}
        .loading=${this.isFetchingRecommendedWallets}
        loadingSpinnerColor=${this.isFetchingRecommendedWallets?"fg-300":"accent-100"}
      ></wui-list-wallet>
    `}onAllWallets(){ee.sendEvent({type:"track",event:"CLICK_ALL_WALLETS"}),U.push("AllWallets")}};qe([u()],Se.prototype,"tabIdx",void 0);qe([P()],Se.prototype,"connectors",void 0);qe([P()],Se.prototype,"count",void 0);qe([P()],Se.prototype,"isFetchingRecommendedWallets",void 0);Se=qe([S("w3m-all-wallets-widget")],Se);var rn=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let Ze=class extends O{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=N.state.connectors,this.unsubscribe.push(N.subscribeKey("connectors",e=>this.connectors=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const e=this.connectors.filter(n=>n.type==="ANNOUNCED");return e?.length?c`
      <wui-flex flexDirection="column" gap="xs">
        ${e.filter(Je.showConnector).map(n=>c`
              <wui-list-wallet
                imageSrc=${E(K.getConnectorImage(n))}
                name=${n.name??"Unknown"}
                @click=${()=>this.onConnector(n)}
                tagVariant="success"
                tagLabel="installed"
                data-testid=${`wallet-selector-${n.id}`}
                .installed=${!0}
                tabIdx=${E(this.tabIdx)}
              >
              </wui-list-wallet>
            `)}
      </wui-flex>
    `:(this.style.cssText="display: none",null)}onConnector(e){e.id==="walletConnect"?A.isMobile()?U.push("AllWallets"):U.push("ConnectingWalletConnect"):U.push("ConnectingExternal",{connector:e})}};rn([u()],Ze.prototype,"tabIdx",void 0);rn([P()],Ze.prototype,"connectors",void 0);Ze=rn([S("w3m-connect-announced-widget")],Ze);var ht=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let De=class extends O{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=N.state.connectors,this.loading=!1,this.unsubscribe.push(N.subscribeKey("connectors",e=>this.connectors=e)),A.isTelegram()&&A.isIos()&&(this.loading=!D.state.wcUri,this.unsubscribe.push(D.subscribeKey("wcUri",e=>this.loading=!e)))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const{customWallets:e}=me.state;if(!e?.length)return this.style.cssText="display: none",null;const n=this.filterOutDuplicateWallets(e);return c`<wui-flex flexDirection="column" gap="xs">
      ${n.map(i=>c`
          <wui-list-wallet
            imageSrc=${E(K.getWalletImage(i))}
            name=${i.name??"Unknown"}
            @click=${()=>this.onConnectWallet(i)}
            data-testid=${`wallet-selector-${i.id}`}
            tabIdx=${E(this.tabIdx)}
            ?loading=${this.loading}
          >
          </wui-list-wallet>
        `)}
    </wui-flex>`}filterOutDuplicateWallets(e){const n=dt.getRecentWallets(),i=this.connectors.map(s=>s.info?.rdns).filter(Boolean),o=n.map(s=>s.rdns).filter(Boolean),t=i.concat(o);if(t.includes("io.metamask.mobile")&&A.isMobile()){const s=t.indexOf("io.metamask.mobile");t[s]="io.metamask"}return e.filter(s=>!t.includes(String(s?.rdns)))}onConnectWallet(e){this.loading||U.push("ConnectingWalletConnect",{wallet:e})}};ht([u()],De.prototype,"tabIdx",void 0);ht([P()],De.prototype,"connectors",void 0);ht([P()],De.prototype,"loading",void 0);De=ht([S("w3m-connect-custom-widget")],De);var an=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let et=class extends O{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=N.state.connectors,this.unsubscribe.push(N.subscribeKey("connectors",e=>this.connectors=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const n=this.connectors.filter(i=>i.type==="EXTERNAL").filter(i=>i.id!==vi.CONNECTOR_ID.COINBASE_SDK);return n?.length?c`
      <wui-flex flexDirection="column" gap="xs">
        ${n.map(i=>c`
            <wui-list-wallet
              imageSrc=${E(K.getConnectorImage(i))}
              .installed=${!0}
              name=${i.name??"Unknown"}
              data-testid=${`wallet-selector-external-${i.id}`}
              @click=${()=>this.onConnector(i)}
              tabIdx=${E(this.tabIdx)}
            >
            </wui-list-wallet>
          `)}
      </wui-flex>
    `:(this.style.cssText="display: none",null)}onConnector(e){U.push("ConnectingExternal",{connector:e})}};an([u()],et.prototype,"tabIdx",void 0);an([P()],et.prototype,"connectors",void 0);et=an([S("w3m-connect-external-widget")],et);var sn=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let tt=class extends O{constructor(){super(...arguments),this.tabIdx=void 0,this.wallets=[]}render(){return this.wallets.length?c`
      <wui-flex flexDirection="column" gap="xs">
        ${this.wallets.map(e=>c`
            <wui-list-wallet
              data-testid=${`wallet-selector-featured-${e.id}`}
              imageSrc=${E(K.getWalletImage(e))}
              name=${e.name??"Unknown"}
              @click=${()=>this.onConnectWallet(e)}
              tabIdx=${E(this.tabIdx)}
            >
            </wui-list-wallet>
          `)}
      </wui-flex>
    `:(this.style.cssText="display: none",null)}onConnectWallet(e){N.selectWalletConnector(e)}};sn([u()],tt.prototype,"tabIdx",void 0);sn([u()],tt.prototype,"wallets",void 0);tt=sn([S("w3m-connect-featured-widget")],tt);var ln=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let nt=class extends O{constructor(){super(...arguments),this.tabIdx=void 0,this.connectors=[]}render(){const e=this.connectors;return!e?.length||e.length===1&&e[0]?.name==="Browser Wallet"&&!A.isMobile()?(this.style.cssText="display: none",null):c`
      <wui-flex flexDirection="column" gap="xs">
        ${e.map(n=>{const i=n.info?.rdns;return!A.isMobile()&&n.name==="Browser Wallet"?null:!i&&!D.checkInstalled()?(this.style.cssText="display: none",null):Je.showConnector(n)?c`
            <wui-list-wallet
              imageSrc=${E(K.getConnectorImage(n))}
              .installed=${!0}
              name=${n.name??"Unknown"}
              tagVariant="success"
              tagLabel="installed"
              data-testid=${`wallet-selector-${n.id}`}
              @click=${()=>this.onConnector(n)}
              tabIdx=${E(this.tabIdx)}
            >
            </wui-list-wallet>
          `:null})}
      </wui-flex>
    `}onConnector(e){N.setActiveConnector(e),U.push("ConnectingExternal",{connector:e})}};ln([u()],nt.prototype,"tabIdx",void 0);ln([u()],nt.prototype,"connectors",void 0);nt=ln([S("w3m-connect-injected-widget")],nt);var cn=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let it=class extends O{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=N.state.connectors,this.unsubscribe.push(N.subscribeKey("connectors",e=>this.connectors=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const e=this.connectors.filter(n=>n.type==="MULTI_CHAIN"&&n.name!=="WalletConnect");return e?.length?c`
      <wui-flex flexDirection="column" gap="xs">
        ${e.map(n=>c`
            <wui-list-wallet
              imageSrc=${E(K.getConnectorImage(n))}
              .installed=${!0}
              name=${n.name??"Unknown"}
              tagVariant="shade"
              tagLabel="multichain"
              data-testid=${`wallet-selector-${n.id}`}
              @click=${()=>this.onConnector(n)}
              tabIdx=${E(this.tabIdx)}
            >
            </wui-list-wallet>
          `)}
      </wui-flex>
    `:(this.style.cssText="display: none",null)}onConnector(e){N.setActiveConnector(e),U.push("ConnectingMultiChain")}};cn([u()],it.prototype,"tabIdx",void 0);cn([P()],it.prototype,"connectors",void 0);it=cn([S("w3m-connect-multi-chain-widget")],it);var ft=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let ze=class extends O{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=N.state.connectors,this.loading=!1,this.unsubscribe.push(N.subscribeKey("connectors",e=>this.connectors=e)),A.isTelegram()&&A.isIos()&&(this.loading=!D.state.wcUri,this.unsubscribe.push(D.subscribeKey("wcUri",e=>this.loading=!e)))}render(){const n=dt.getRecentWallets().filter(i=>!this.connectors.some(o=>o.id===i.id||o.name===i.name));return n.length?c`
      <wui-flex flexDirection="column" gap="xs">
        ${n.map(i=>c`
            <wui-list-wallet
              imageSrc=${E(K.getWalletImage(i))}
              name=${i.name??"Unknown"}
              @click=${()=>this.onConnectWallet(i)}
              tagLabel="recent"
              tagVariant="shade"
              tabIdx=${E(this.tabIdx)}
              ?loading=${this.loading}
            >
            </wui-list-wallet>
          `)}
      </wui-flex>
    `:(this.style.cssText="display: none",null)}onConnectWallet(e){this.loading||N.selectWalletConnector(e)}};ft([u()],ze.prototype,"tabIdx",void 0);ft([P()],ze.prototype,"connectors",void 0);ft([P()],ze.prototype,"loading",void 0);ze=ft([S("w3m-connect-recent-widget")],ze);var pt=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let ke=class extends O{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.wallets=[],this.loading=!1,A.isTelegram()&&A.isIos()&&(this.loading=!D.state.wcUri,this.unsubscribe.push(D.subscribeKey("wcUri",e=>this.loading=!e)))}render(){const{connectors:e}=N.state,{customWallets:n,featuredWalletIds:i}=me.state,o=dt.getRecentWallets(),t=e.find(w=>w.id==="walletConnect"),s=e.filter(w=>w.type==="INJECTED"||w.type==="ANNOUNCED"||w.type==="MULTI_CHAIN").filter(w=>w.name!=="Browser Wallet");if(!t)return null;if(i||n||!this.wallets.length)return this.style.cssText="display: none",null;const l=s.length+o.length,d=Math.max(0,2-l),p=on.filterOutDuplicateWallets(this.wallets).slice(0,d);return p.length?c`
      <wui-flex flexDirection="column" gap="xs">
        ${p.map(w=>c`
            <wui-list-wallet
              imageSrc=${E(K.getWalletImage(w))}
              name=${w?.name??"Unknown"}
              @click=${()=>this.onConnectWallet(w)}
              tabIdx=${E(this.tabIdx)}
              ?loading=${this.loading}
            >
            </wui-list-wallet>
          `)}
      </wui-flex>
    `:(this.style.cssText="display: none",null)}onConnectWallet(e){if(this.loading)return;const n=N.getConnector(e.id,e.rdns);n?U.push("ConnectingExternal",{connector:n}):U.push("ConnectingWalletConnect",{wallet:e})}};pt([u()],ke.prototype,"tabIdx",void 0);pt([u()],ke.prototype,"wallets",void 0);pt([P()],ke.prototype,"loading",void 0);ke=pt([S("w3m-connect-recommended-widget")],ke);var gt=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let Ne=class extends O{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=N.state.connectors,this.connectorImages=bn.state.connectorImages,this.unsubscribe.push(N.subscribeKey("connectors",e=>this.connectors=e),bn.subscribeKey("connectorImages",e=>this.connectorImages=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){if(A.isMobile())return this.style.cssText="display: none",null;const e=this.connectors.find(i=>i.id==="walletConnect");if(!e)return this.style.cssText="display: none",null;const n=e.imageUrl||this.connectorImages[e?.imageId??""];return c`
      <wui-list-wallet
        imageSrc=${E(n)}
        name=${e.name??"Unknown"}
        @click=${()=>this.onConnector(e)}
        tagLabel="qr code"
        tagVariant="main"
        tabIdx=${E(this.tabIdx)}
        data-testid="wallet-selector-walletconnect"
      >
      </wui-list-wallet>
    `}onConnector(e){N.setActiveConnector(e),U.push("ConnectingWalletConnect")}};gt([u()],Ne.prototype,"tabIdx",void 0);gt([P()],Ne.prototype,"connectors",void 0);gt([P()],Ne.prototype,"connectorImages",void 0);Ne=gt([S("w3m-connect-walletconnect-widget")],Ne);const Si=k`
  :host {
    margin-top: var(--wui-spacing-3xs);
  }
  wui-separator {
    margin: var(--wui-spacing-m) calc(var(--wui-spacing-m) * -1) var(--wui-spacing-xs)
      calc(var(--wui-spacing-m) * -1);
    width: calc(100% + var(--wui-spacing-s) * 2);
  }
`;var Fe=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let ve=class extends O{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=N.state.connectors,this.recommended=M.state.recommended,this.featured=M.state.featured,this.unsubscribe.push(N.subscribeKey("connectors",e=>this.connectors=e),M.subscribeKey("recommended",e=>this.recommended=e),M.subscribeKey("featured",e=>this.featured=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return c`
      <wui-flex flexDirection="column" gap="xs"> ${this.connectorListTemplate()} </wui-flex>
    `}connectorListTemplate(){const{custom:e,recent:n,announced:i,injected:o,multiChain:t,recommended:a,featured:s,external:l}=Je.getConnectorsByType(this.connectors,this.recommended,this.featured);return Je.getConnectorTypeOrder({custom:e,recent:n,announced:i,injected:o,multiChain:t,recommended:a,featured:s,external:l}).map(p=>{switch(p){case"injected":return c`
            ${t.length?c`<w3m-connect-multi-chain-widget
                  tabIdx=${E(this.tabIdx)}
                ></w3m-connect-multi-chain-widget>`:null}
            ${i.length?c`<w3m-connect-announced-widget
                  tabIdx=${E(this.tabIdx)}
                ></w3m-connect-announced-widget>`:null}
            ${o.length?c`<w3m-connect-injected-widget
                  .connectors=${o}
                  tabIdx=${E(this.tabIdx)}
                ></w3m-connect-injected-widget>`:null}
          `;case"walletConnect":return c`<w3m-connect-walletconnect-widget
            tabIdx=${E(this.tabIdx)}
          ></w3m-connect-walletconnect-widget>`;case"recent":return c`<w3m-connect-recent-widget
            tabIdx=${E(this.tabIdx)}
          ></w3m-connect-recent-widget>`;case"featured":return c`<w3m-connect-featured-widget
            .wallets=${s}
            tabIdx=${E(this.tabIdx)}
          ></w3m-connect-featured-widget>`;case"custom":return c`<w3m-connect-custom-widget
            tabIdx=${E(this.tabIdx)}
          ></w3m-connect-custom-widget>`;case"external":return c`<w3m-connect-external-widget
            tabIdx=${E(this.tabIdx)}
          ></w3m-connect-external-widget>`;case"recommended":return c`<w3m-connect-recommended-widget
            .wallets=${a}
            tabIdx=${E(this.tabIdx)}
          ></w3m-connect-recommended-widget>`;default:return console.warn(`Unknown connector type: ${p}`),null}})}};ve.styles=Si;Fe([u()],ve.prototype,"tabIdx",void 0);Fe([P()],ve.prototype,"connectors",void 0);Fe([P()],ve.prototype,"recommended",void 0);Fe([P()],ve.prototype,"featured",void 0);ve=Fe([S("w3m-connector-list")],ve);const Ti=k`
  :host {
    display: inline-flex;
    background-color: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-3xl);
    padding: var(--wui-spacing-3xs);
    position: relative;
    height: 36px;
    min-height: 36px;
    overflow: hidden;
  }

  :host::before {
    content: '';
    position: absolute;
    pointer-events: none;
    top: 4px;
    left: 4px;
    display: block;
    width: var(--local-tab-width);
    height: 28px;
    border-radius: var(--wui-border-radius-3xl);
    background-color: var(--wui-color-gray-glass-002);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-002);
    transform: translateX(calc(var(--local-tab) * var(--local-tab-width)));
    transition: transform var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: background-color, opacity;
  }

  :host([data-type='flex'])::before {
    left: 3px;
    transform: translateX(calc((var(--local-tab) * 34px) + (var(--local-tab) * 4px)));
  }

  :host([data-type='flex']) {
    display: flex;
    padding: 0px 0px 0px 12px;
    gap: 4px;
  }

  :host([data-type='flex']) > button > wui-text {
    position: absolute;
    left: 18px;
    opacity: 0;
  }

  button[data-active='true'] > wui-icon,
  button[data-active='true'] > wui-text {
    color: var(--wui-color-fg-100);
  }

  button[data-active='false'] > wui-icon,
  button[data-active='false'] > wui-text {
    color: var(--wui-color-fg-200);
  }

  button[data-active='true']:disabled,
  button[data-active='false']:disabled {
    background-color: transparent;
    opacity: 0.5;
    cursor: not-allowed;
  }

  button[data-active='true']:disabled > wui-text {
    color: var(--wui-color-fg-200);
  }

  button[data-active='false']:disabled > wui-text {
    color: var(--wui-color-fg-300);
  }

  button > wui-icon,
  button > wui-text {
    pointer-events: none;
    transition: color var(--wui-e ase-out-power-1) var(--wui-duration-md);
    will-change: color;
  }

  button {
    width: var(--local-tab-width);
    transition: background-color var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: background-color;
  }

  :host([data-type='flex']) > button {
    width: 34px;
    position: relative;
    display: flex;
    justify-content: flex-start;
  }

  button:hover:enabled,
  button:active:enabled {
    background-color: transparent !important;
  }

  button:hover:enabled > wui-icon,
  button:active:enabled > wui-icon {
    transition: all var(--wui-ease-out-power-1) var(--wui-duration-lg);
    color: var(--wui-color-fg-125);
  }

  button:hover:enabled > wui-text,
  button:active:enabled > wui-text {
    transition: all var(--wui-ease-out-power-1) var(--wui-duration-lg);
    color: var(--wui-color-fg-125);
  }

  button {
    border-radius: var(--wui-border-radius-3xl);
  }
`;var be=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let re=class extends O{constructor(){super(...arguments),this.tabs=[],this.onTabChange=()=>null,this.buttons=[],this.disabled=!1,this.localTabWidth="100px",this.activeTab=0,this.isDense=!1}render(){return this.isDense=this.tabs.length>3,this.style.cssText=`
      --local-tab: ${this.activeTab};
      --local-tab-width: ${this.localTabWidth};
    `,this.dataset.type=this.isDense?"flex":"block",this.tabs.map((e,n)=>{const i=n===this.activeTab;return c`
        <button
          ?disabled=${this.disabled}
          @click=${()=>this.onTabClick(n)}
          data-active=${i}
          data-testid="tab-${e.label?.toLowerCase()}"
        >
          ${this.iconTemplate(e)}
          <wui-text variant="small-600" color="inherit"> ${e.label} </wui-text>
        </button>
      `})}firstUpdated(){this.shadowRoot&&this.isDense&&(this.buttons=[...this.shadowRoot.querySelectorAll("button")],setTimeout(()=>{this.animateTabs(0,!0)},0))}iconTemplate(e){return e.icon?c`<wui-icon size="xs" color="inherit" name=${e.icon}></wui-icon>`:null}onTabClick(e){this.buttons&&this.animateTabs(e,!1),this.activeTab=e,this.onTabChange(e)}animateTabs(e,n){const i=this.buttons[this.activeTab],o=this.buttons[e],t=i?.querySelector("wui-text"),a=o?.querySelector("wui-text"),s=o?.getBoundingClientRect(),l=a?.getBoundingClientRect();i&&t&&!n&&e!==this.activeTab&&(t.animate([{opacity:0}],{duration:50,easing:"ease",fill:"forwards"}),i.animate([{width:"34px"}],{duration:500,easing:"ease",fill:"forwards"})),o&&s&&l&&a&&(e!==this.activeTab||n)&&(this.localTabWidth=`${Math.round(s.width+l.width)+6}px`,o.animate([{width:`${s.width+l.width}px`}],{duration:n?0:500,fill:"forwards",easing:"ease"}),a.animate([{opacity:1}],{duration:n?0:125,delay:n?0:200,fill:"forwards",easing:"ease"}))}};re.styles=[q,G,Ti];be([u({type:Array})],re.prototype,"tabs",void 0);be([u()],re.prototype,"onTabChange",void 0);be([u({type:Array})],re.prototype,"buttons",void 0);be([u({type:Boolean})],re.prototype,"disabled",void 0);be([u()],re.prototype,"localTabWidth",void 0);be([P()],re.prototype,"activeTab",void 0);be([P()],re.prototype,"isDense",void 0);re=be([S("wui-tabs")],re);var wt=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let Me=class extends O{constructor(){super(),this.platformTabs=[],this.unsubscribe=[],this.platforms=[],this.onSelectPlatfrom=void 0,this.buffering=!1,this.unsubscribe.push(D.subscribeKey("buffering",e=>this.buffering=e))}disconnectCallback(){this.unsubscribe.forEach(e=>e())}render(){const e=this.generateTabs();return c`
      <wui-flex justifyContent="center" .padding=${["0","0","l","0"]}>
        <wui-tabs
          ?disabled=${this.buffering}
          .tabs=${e}
          .onTabChange=${this.onTabChange.bind(this)}
        ></wui-tabs>
      </wui-flex>
    `}generateTabs(){const e=this.platforms.map(n=>n==="browser"?{label:"Browser",icon:"extension",platform:"browser"}:n==="mobile"?{label:"Mobile",icon:"mobile",platform:"mobile"}:n==="qrcode"?{label:"Mobile",icon:"mobile",platform:"qrcode"}:n==="web"?{label:"Webapp",icon:"browser",platform:"web"}:n==="desktop"?{label:"Desktop",icon:"desktop",platform:"desktop"}:{label:"Browser",icon:"extension",platform:"unsupported"});return this.platformTabs=e.map(({platform:n})=>n),e}onTabChange(e){const n=this.platformTabs[e];n&&this.onSelectPlatfrom?.(n)}};wt([u({type:Array})],Me.prototype,"platforms",void 0);wt([u()],Me.prototype,"onSelectPlatfrom",void 0);wt([P()],Me.prototype,"buffering",void 0);Me=wt([S("w3m-connecting-header")],Me);const Bi=k`
  :host {
    width: var(--local-width);
    position: relative;
  }

  button {
    border: none;
    border-radius: var(--local-border-radius);
    width: var(--local-width);
    white-space: nowrap;
  }

  /* -- Sizes --------------------------------------------------- */
  button[data-size='md'] {
    padding: 8.2px var(--wui-spacing-l) 9px var(--wui-spacing-l);
    height: 36px;
  }

  button[data-size='md'][data-icon-left='true'][data-icon-right='false'] {
    padding: 8.2px var(--wui-spacing-l) 9px var(--wui-spacing-s);
  }

  button[data-size='md'][data-icon-right='true'][data-icon-left='false'] {
    padding: 8.2px var(--wui-spacing-s) 9px var(--wui-spacing-l);
  }

  button[data-size='lg'] {
    padding: var(--wui-spacing-m) var(--wui-spacing-2l);
    height: 48px;
  }

  /* -- Variants --------------------------------------------------------- */
  button[data-variant='main'] {
    background-color: var(--wui-color-accent-100);
    color: var(--wui-color-inverse-100);
    border: none;
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-010);
  }

  button[data-variant='inverse'] {
    background-color: var(--wui-color-inverse-100);
    color: var(--wui-color-inverse-000);
    border: none;
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-010);
  }

  button[data-variant='accent'] {
    background-color: var(--wui-color-accent-glass-010);
    color: var(--wui-color-accent-100);
    border: none;
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-005);
  }

  button[data-variant='accent-error'] {
    background: var(--wui-color-error-glass-015);
    color: var(--wui-color-error-100);
    border: none;
    box-shadow: inset 0 0 0 1px var(--wui-color-error-glass-010);
  }

  button[data-variant='accent-success'] {
    background: var(--wui-color-success-glass-015);
    color: var(--wui-color-success-100);
    border: none;
    box-shadow: inset 0 0 0 1px var(--wui-color-success-glass-010);
  }

  button[data-variant='neutral'] {
    background: transparent;
    color: var(--wui-color-fg-100);
    border: none;
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-005);
  }

  /* -- Focus states --------------------------------------------------- */
  button[data-variant='main']:focus-visible:enabled {
    background-color: var(--wui-color-accent-090);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-accent-100),
      0 0 0 4px var(--wui-color-accent-glass-020);
  }
  button[data-variant='inverse']:focus-visible:enabled {
    background-color: var(--wui-color-inverse-100);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-gray-glass-010),
      0 0 0 4px var(--wui-color-accent-glass-020);
  }
  button[data-variant='accent']:focus-visible:enabled {
    background-color: var(--wui-color-accent-glass-010);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-accent-100),
      0 0 0 4px var(--wui-color-accent-glass-020);
  }
  button[data-variant='accent-error']:focus-visible:enabled {
    background: var(--wui-color-error-glass-015);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-error-100),
      0 0 0 4px var(--wui-color-error-glass-020);
  }
  button[data-variant='accent-success']:focus-visible:enabled {
    background: var(--wui-color-success-glass-015);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-success-100),
      0 0 0 4px var(--wui-color-success-glass-020);
  }
  button[data-variant='neutral']:focus-visible:enabled {
    background: var(--wui-color-gray-glass-005);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-gray-glass-010),
      0 0 0 4px var(--wui-color-gray-glass-002);
  }

  /* -- Hover & Active states ----------------------------------------------------------- */
  @media (hover: hover) and (pointer: fine) {
    button[data-variant='main']:hover:enabled {
      background-color: var(--wui-color-accent-090);
    }

    button[data-variant='main']:active:enabled {
      background-color: var(--wui-color-accent-080);
    }

    button[data-variant='accent']:hover:enabled {
      background-color: var(--wui-color-accent-glass-015);
    }

    button[data-variant='accent']:active:enabled {
      background-color: var(--wui-color-accent-glass-020);
    }

    button[data-variant='accent-error']:hover:enabled {
      background: var(--wui-color-error-glass-020);
      color: var(--wui-color-error-100);
    }

    button[data-variant='accent-error']:active:enabled {
      background: var(--wui-color-error-glass-030);
      color: var(--wui-color-error-100);
    }

    button[data-variant='accent-success']:hover:enabled {
      background: var(--wui-color-success-glass-020);
      color: var(--wui-color-success-100);
    }

    button[data-variant='accent-success']:active:enabled {
      background: var(--wui-color-success-glass-030);
      color: var(--wui-color-success-100);
    }

    button[data-variant='neutral']:hover:enabled {
      background: var(--wui-color-gray-glass-002);
    }

    button[data-variant='neutral']:active:enabled {
      background: var(--wui-color-gray-glass-005);
    }

    button[data-size='lg'][data-icon-left='true'][data-icon-right='false'] {
      padding-left: var(--wui-spacing-m);
    }

    button[data-size='lg'][data-icon-right='true'][data-icon-left='false'] {
      padding-right: var(--wui-spacing-m);
    }
  }

  /* -- Disabled state --------------------------------------------------- */
  button:disabled {
    background-color: var(--wui-color-gray-glass-002);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-002);
    color: var(--wui-color-gray-glass-020);
    cursor: not-allowed;
  }

  button > wui-text {
    transition: opacity var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: opacity;
    opacity: var(--local-opacity-100);
  }

  ::slotted(*) {
    transition: opacity var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: opacity;
    opacity: var(--local-opacity-100);
  }

  wui-loading-spinner {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    opacity: var(--local-opacity-000);
  }
`;var ae=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};const yn={main:"inverse-100",inverse:"inverse-000",accent:"accent-100","accent-error":"error-100","accent-success":"success-100",neutral:"fg-100",disabled:"gray-glass-020"},Pi={lg:"paragraph-600",md:"small-600"},Li={lg:"md",md:"md"};let Q=class extends O{constructor(){super(...arguments),this.size="lg",this.disabled=!1,this.fullWidth=!1,this.loading=!1,this.variant="main",this.hasIconLeft=!1,this.hasIconRight=!1,this.borderRadius="m"}render(){this.style.cssText=`
    --local-width: ${this.fullWidth?"100%":"auto"};
    --local-opacity-100: ${this.loading?0:1};
    --local-opacity-000: ${this.loading?1:0};
    --local-border-radius: var(--wui-border-radius-${this.borderRadius});
    `;const e=this.textVariant??Pi[this.size];return c`
      <button
        data-variant=${this.variant}
        data-icon-left=${this.hasIconLeft}
        data-icon-right=${this.hasIconRight}
        data-size=${this.size}
        ?disabled=${this.disabled}
      >
        ${this.loadingTemplate()}
        <slot name="iconLeft" @slotchange=${()=>this.handleSlotLeftChange()}></slot>
        <wui-text variant=${e} color="inherit">
          <slot></slot>
        </wui-text>
        <slot name="iconRight" @slotchange=${()=>this.handleSlotRightChange()}></slot>
      </button>
    `}handleSlotLeftChange(){this.hasIconLeft=!0}handleSlotRightChange(){this.hasIconRight=!0}loadingTemplate(){if(this.loading){const e=Li[this.size],n=this.disabled?yn.disabled:yn[this.variant];return c`<wui-loading-spinner color=${n} size=${e}></wui-loading-spinner>`}return c``}};Q.styles=[q,G,Bi];ae([u()],Q.prototype,"size",void 0);ae([u({type:Boolean})],Q.prototype,"disabled",void 0);ae([u({type:Boolean})],Q.prototype,"fullWidth",void 0);ae([u({type:Boolean})],Q.prototype,"loading",void 0);ae([u()],Q.prototype,"variant",void 0);ae([u({type:Boolean})],Q.prototype,"hasIconLeft",void 0);ae([u({type:Boolean})],Q.prototype,"hasIconRight",void 0);ae([u()],Q.prototype,"borderRadius",void 0);ae([u()],Q.prototype,"textVariant",void 0);Q=ae([S("wui-button")],Q);const Oi=k`
  button {
    padding: var(--wui-spacing-4xs) var(--wui-spacing-xxs);
    border-radius: var(--wui-border-radius-3xs);
    background-color: transparent;
    color: var(--wui-color-accent-100);
  }

  button:disabled {
    background-color: transparent;
    color: var(--wui-color-gray-glass-015);
  }

  button:hover {
    background-color: var(--wui-color-gray-glass-005);
  }
`;var bt=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let Te=class extends O{constructor(){super(...arguments),this.tabIdx=void 0,this.disabled=!1,this.color="inherit"}render(){return c`
      <button ?disabled=${this.disabled} tabindex=${E(this.tabIdx)}>
        <slot name="iconLeft"></slot>
        <wui-text variant="small-600" color=${this.color}>
          <slot></slot>
        </wui-text>
        <slot name="iconRight"></slot>
      </button>
    `}};Te.styles=[q,G,Oi];bt([u()],Te.prototype,"tabIdx",void 0);bt([u({type:Boolean})],Te.prototype,"disabled",void 0);bt([u()],Te.prototype,"color",void 0);Te=bt([S("wui-link")],Te);const Ai=k`
  :host {
    display: block;
    width: var(--wui-box-size-md);
    height: var(--wui-box-size-md);
  }

  svg {
    width: var(--wui-box-size-md);
    height: var(--wui-box-size-md);
  }

  rect {
    fill: none;
    stroke: var(--wui-color-accent-100);
    stroke-width: 4px;
    stroke-linecap: round;
    animation: dash 1s linear infinite;
  }

  @keyframes dash {
    to {
      stroke-dashoffset: 0px;
    }
  }
`;var oi=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let ot=class extends O{constructor(){super(...arguments),this.radius=36}render(){return this.svgLoaderTemplate()}svgLoaderTemplate(){const e=this.radius>50?50:this.radius,i=36-e,o=116+i,t=245+i,a=360+i*1.75;return c`
      <svg viewBox="0 0 110 110" width="110" height="110">
        <rect
          x="2"
          y="2"
          width="106"
          height="106"
          rx=${e}
          stroke-dasharray="${o} ${t}"
          stroke-dashoffset=${a}
        />
      </svg>
    `}};ot.styles=[q,Ai];oi([u({type:Number})],ot.prototype,"radius",void 0);ot=oi([S("wui-loading-thumbnail")],ot);const ji=k`
  button {
    border: none;
    border-radius: var(--wui-border-radius-3xl);
  }

  button[data-variant='main'] {
    background-color: var(--wui-color-accent-100);
    color: var(--wui-color-inverse-100);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-010);
  }

  button[data-variant='accent'] {
    background-color: var(--wui-color-accent-glass-010);
    color: var(--wui-color-accent-100);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-005);
  }

  button[data-variant='gray'] {
    background-color: transparent;
    color: var(--wui-color-fg-200);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-010);
  }

  button[data-variant='shade'] {
    background-color: transparent;
    color: var(--wui-color-accent-100);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-010);
  }

  button[data-size='sm'] {
    height: 32px;
    padding: 0 var(--wui-spacing-s);
  }

  button[data-size='md'] {
    height: 40px;
    padding: 0 var(--wui-spacing-l);
  }

  button[data-size='sm'] > wui-image {
    width: 16px;
    height: 16px;
  }

  button[data-size='md'] > wui-image {
    width: 24px;
    height: 24px;
  }

  button[data-size='sm'] > wui-icon {
    width: 12px;
    height: 12px;
  }

  button[data-size='md'] > wui-icon {
    width: 14px;
    height: 14px;
  }

  wui-image {
    border-radius: var(--wui-border-radius-3xl);
    overflow: hidden;
  }

  button.disabled > wui-icon,
  button.disabled > wui-image {
    filter: grayscale(1);
  }

  button[data-variant='main'] > wui-image {
    box-shadow: inset 0 0 0 1px var(--wui-color-accent-090);
  }

  button[data-variant='shade'] > wui-image,
  button[data-variant='gray'] > wui-image {
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-010);
  }

  @media (hover: hover) and (pointer: fine) {
    button[data-variant='main']:focus-visible {
      background-color: var(--wui-color-accent-090);
    }

    button[data-variant='main']:hover:enabled {
      background-color: var(--wui-color-accent-090);
    }

    button[data-variant='main']:active:enabled {
      background-color: var(--wui-color-accent-080);
    }

    button[data-variant='accent']:hover:enabled {
      background-color: var(--wui-color-accent-glass-015);
    }

    button[data-variant='accent']:active:enabled {
      background-color: var(--wui-color-accent-glass-020);
    }

    button[data-variant='shade']:focus-visible,
    button[data-variant='gray']:focus-visible,
    button[data-variant='shade']:hover,
    button[data-variant='gray']:hover {
      background-color: var(--wui-color-gray-glass-002);
    }

    button[data-variant='gray']:active,
    button[data-variant='shade']:active {
      background-color: var(--wui-color-gray-glass-005);
    }
  }

  button.disabled {
    color: var(--wui-color-gray-glass-020);
    background-color: var(--wui-color-gray-glass-002);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-002);
    pointer-events: none;
  }
`;var $e=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let fe=class extends O{constructor(){super(...arguments),this.variant="accent",this.imageSrc="",this.disabled=!1,this.icon="externalLink",this.size="md",this.text=""}render(){const e=this.size==="sm"?"small-600":"paragraph-600";return c`
      <button
        class=${this.disabled?"disabled":""}
        data-variant=${this.variant}
        data-size=${this.size}
      >
        ${this.imageSrc?c`<wui-image src=${this.imageSrc}></wui-image>`:null}
        <wui-text variant=${e} color="inherit"> ${this.text} </wui-text>
        <wui-icon name=${this.icon} color="inherit" size="inherit"></wui-icon>
      </button>
    `}};fe.styles=[q,G,ji];$e([u()],fe.prototype,"variant",void 0);$e([u()],fe.prototype,"imageSrc",void 0);$e([u({type:Boolean})],fe.prototype,"disabled",void 0);$e([u()],fe.prototype,"icon",void 0);$e([u()],fe.prototype,"size",void 0);$e([u()],fe.prototype,"text",void 0);fe=$e([S("wui-chip-button")],fe);const Di=k`
  wui-flex {
    width: 100%;
    background-color: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-xs);
  }
`;var mt=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let Be=class extends O{constructor(){super(...arguments),this.disabled=!1,this.label="",this.buttonLabel=""}render(){return c`
      <wui-flex
        justifyContent="space-between"
        alignItems="center"
        .padding=${["1xs","2l","1xs","2l"]}
      >
        <wui-text variant="paragraph-500" color="fg-200">${this.label}</wui-text>
        <wui-chip-button size="sm" variant="shade" text=${this.buttonLabel} icon="chevronRight">
        </wui-chip-button>
      </wui-flex>
    `}};Be.styles=[q,G,Di];mt([u({type:Boolean})],Be.prototype,"disabled",void 0);mt([u()],Be.prototype,"label",void 0);mt([u()],Be.prototype,"buttonLabel",void 0);Be=mt([S("wui-cta-button")],Be);const zi=k`
  :host {
    display: block;
    padding: 0 var(--wui-spacing-xl) var(--wui-spacing-xl);
  }
`;var ri=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let rt=class extends O{constructor(){super(...arguments),this.wallet=void 0}render(){if(!this.wallet)return this.style.display="none",null;const{name:e,app_store:n,play_store:i,chrome_store:o,homepage:t}=this.wallet,a=A.isMobile(),s=A.isIos(),l=A.isAndroid(),d=[n,i,t,o].filter(Boolean).length>1,p=de.getTruncateString({string:e,charsStart:12,charsEnd:0,truncate:"end"});return d&&!a?c`
        <wui-cta-button
          label=${`Don't have ${p}?`}
          buttonLabel="Get"
          @click=${()=>U.push("Downloads",{wallet:this.wallet})}
        ></wui-cta-button>
      `:!d&&t?c`
        <wui-cta-button
          label=${`Don't have ${p}?`}
          buttonLabel="Get"
          @click=${this.onHomePage.bind(this)}
        ></wui-cta-button>
      `:n&&s?c`
        <wui-cta-button
          label=${`Don't have ${p}?`}
          buttonLabel="Get"
          @click=${this.onAppStore.bind(this)}
        ></wui-cta-button>
      `:i&&l?c`
        <wui-cta-button
          label=${`Don't have ${p}?`}
          buttonLabel="Get"
          @click=${this.onPlayStore.bind(this)}
        ></wui-cta-button>
      `:(this.style.display="none",null)}onAppStore(){this.wallet?.app_store&&A.openHref(this.wallet.app_store,"_blank")}onPlayStore(){this.wallet?.play_store&&A.openHref(this.wallet.play_store,"_blank")}onHomePage(){this.wallet?.homepage&&A.openHref(this.wallet.homepage,"_blank")}};rt.styles=[zi];ri([u({type:Object})],rt.prototype,"wallet",void 0);rt=ri([S("w3m-mobile-download-links")],rt);const ki=k`
  @keyframes shake {
    0% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(3px);
    }
    50% {
      transform: translateX(-3px);
    }
    75% {
      transform: translateX(3px);
    }
    100% {
      transform: translateX(0);
    }
  }

  wui-flex:first-child:not(:only-child) {
    position: relative;
  }

  wui-loading-thumbnail {
    position: absolute;
  }

  wui-icon-box {
    position: absolute;
    right: calc(var(--wui-spacing-3xs) * -1);
    bottom: calc(var(--wui-spacing-3xs) * -1);
    opacity: 0;
    transform: scale(0.5);
    transition-property: opacity, transform;
    transition-duration: var(--wui-duration-lg);
    transition-timing-function: var(--wui-ease-out-power-2);
    will-change: opacity, transform;
  }

  wui-text[align='center'] {
    width: 100%;
    padding: 0px var(--wui-spacing-l);
  }

  [data-error='true'] wui-icon-box {
    opacity: 1;
    transform: scale(1);
  }

  [data-error='true'] > wui-flex:first-child {
    animation: shake 250ms cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  }

  [data-retry='false'] wui-link {
    display: none;
  }

  [data-retry='true'] wui-link {
    display: block;
    opacity: 1;
  }
`;var ne=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};class F extends O{constructor(){super(),this.wallet=U.state.data?.wallet,this.connector=U.state.data?.connector,this.timeout=void 0,this.secondaryBtnIcon="refresh",this.onConnect=void 0,this.onRender=void 0,this.onAutoConnect=void 0,this.isWalletConnect=!0,this.unsubscribe=[],this.imageSrc=K.getWalletImage(this.wallet)??K.getConnectorImage(this.connector),this.name=this.wallet?.name??this.connector?.name??"Wallet",this.isRetrying=!1,this.uri=D.state.wcUri,this.error=D.state.wcError,this.ready=!1,this.showRetry=!1,this.secondaryBtnLabel="Try again",this.secondaryLabel="Accept connection request in the wallet",this.buffering=!1,this.isLoading=!1,this.isMobile=!1,this.onRetry=void 0,this.unsubscribe.push(D.subscribeKey("wcUri",e=>{this.uri=e,this.isRetrying&&this.onRetry&&(this.isRetrying=!1,this.onConnect?.())}),D.subscribeKey("wcError",e=>this.error=e),D.subscribeKey("buffering",e=>this.buffering=e)),(A.isTelegram()||A.isSafari())&&A.isIos()&&D.state.wcUri&&this.onConnect?.()}firstUpdated(){this.onAutoConnect?.(),this.showRetry=!this.onAutoConnect}disconnectedCallback(){this.unsubscribe.forEach(e=>e()),clearTimeout(this.timeout)}render(){this.onRender?.(),this.onShowRetry();const e=this.error?"Connection can be declined if a previous request is still active":this.secondaryLabel;let n=`Continue in ${this.name}`;return this.buffering&&(n="Connecting..."),this.error&&(n="Connection declined"),c`
      <wui-flex
        data-error=${E(this.error)}
        data-retry=${this.showRetry}
        flexDirection="column"
        alignItems="center"
        .padding=${["3xl","xl","xl","xl"]}
        gap="xl"
      >
        <wui-flex justifyContent="center" alignItems="center">
          <wui-wallet-image size="lg" imageSrc=${E(this.imageSrc)}></wui-wallet-image>

          ${this.error?null:this.loaderTemplate()}

          <wui-icon-box
            backgroundColor="error-100"
            background="opaque"
            iconColor="error-100"
            icon="close"
            size="sm"
            border
            borderColor="wui-color-bg-125"
          ></wui-icon-box>
        </wui-flex>

        <wui-flex flexDirection="column" alignItems="center" gap="xs">
          <wui-text variant="paragraph-500" color=${this.error?"error-100":"fg-100"}>
            ${n}
          </wui-text>
          <wui-text align="center" variant="small-500" color="fg-200">${e}</wui-text>
        </wui-flex>

        ${this.secondaryBtnLabel?c`
              <wui-button
                variant="accent"
                size="md"
                ?disabled=${this.isRetrying||!this.error&&this.buffering||this.isLoading}
                @click=${this.onTryAgain.bind(this)}
                data-testid="w3m-connecting-widget-secondary-button"
              >
                <wui-icon color="inherit" slot="iconLeft" name=${this.secondaryBtnIcon}></wui-icon>
                ${this.secondaryBtnLabel}
              </wui-button>
            `:null}
      </wui-flex>

      ${this.isWalletConnect?c`
            <wui-flex .padding=${["0","xl","xl","xl"]} justifyContent="center">
              <wui-link @click=${this.onCopyUri} color="fg-200" data-testid="wui-link-copy">
                <wui-icon size="xs" color="fg-200" slot="iconLeft" name="copy"></wui-icon>
                Copy link
              </wui-link>
            </wui-flex>
          `:null}

      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links>
    `}onShowRetry(){this.error&&!this.showRetry&&(this.showRetry=!0,this.shadowRoot?.querySelector("wui-button")?.animate([{opacity:0},{opacity:1}],{fill:"forwards",easing:"ease"}))}onTryAgain(){this.buffering||(D.setWcError(!1),this.onRetry?(this.isRetrying=!0,this.onRetry?.()):this.onConnect?.())}loaderTemplate(){const e=Qt.state.themeVariables["--w3m-border-radius-master"],n=e?parseInt(e.replace("px",""),10):4;return c`<wui-loading-thumbnail radius=${n*9}></wui-loading-thumbnail>`}onCopyUri(){try{this.uri&&(A.copyToClopboard(this.uri),Qe.showSuccess("Link copied"))}catch{Qe.showError("Failed to copy")}}}F.styles=ki;ne([P()],F.prototype,"isRetrying",void 0);ne([P()],F.prototype,"uri",void 0);ne([P()],F.prototype,"error",void 0);ne([P()],F.prototype,"ready",void 0);ne([P()],F.prototype,"showRetry",void 0);ne([P()],F.prototype,"secondaryBtnLabel",void 0);ne([P()],F.prototype,"secondaryLabel",void 0);ne([P()],F.prototype,"buffering",void 0);ne([P()],F.prototype,"isLoading",void 0);ne([u({type:Boolean})],F.prototype,"isMobile",void 0);ne([u()],F.prototype,"onRetry",void 0);var Ni=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let xn=class extends F{constructor(){if(super(),!this.wallet)throw new Error("w3m-connecting-wc-browser: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.onAutoConnect=this.onConnectProxy.bind(this),ee.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"browser"}})}async onConnectProxy(){try{this.error=!1;const{connectors:e}=N.state,n=e.find(i=>i.type==="ANNOUNCED"&&i.info?.rdns===this.wallet?.rdns||i.type==="INJECTED"||i.name===this.wallet?.name);if(n)await D.connectExternal(n,n.chain);else throw new Error("w3m-connecting-wc-browser: No connector found");ni.close(),ee.sendEvent({type:"track",event:"CONNECT_SUCCESS",properties:{method:"browser",name:this.wallet?.name||"Unknown"}})}catch(e){ee.sendEvent({type:"track",event:"CONNECT_ERROR",properties:{message:e?.message??"Unknown"}}),this.error=!0}}};xn=Ni([S("w3m-connecting-wc-browser")],xn);var Mi=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let Cn=class extends F{constructor(){if(super(),!this.wallet)throw new Error("w3m-connecting-wc-desktop: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.onRender=this.onRenderProxy.bind(this),ee.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"desktop"}})}onRenderProxy(){!this.ready&&this.uri&&(this.ready=!0,this.onConnect?.())}onConnectProxy(){if(this.wallet?.desktop_link&&this.uri)try{this.error=!1;const{desktop_link:e,name:n}=this.wallet,{redirect:i,href:o}=A.formatNativeUrl(e,this.uri);D.setWcLinking({name:n,href:o}),D.setRecentWallet(this.wallet),A.openHref(i,"_blank")}catch{this.error=!0}}};Cn=Mi([S("w3m-connecting-wc-desktop")],Cn);var Ui=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let Rn=class extends F{constructor(){if(super(),this.btnLabelTimeout=void 0,this.labelTimeout=void 0,this.onRender=()=>{!this.ready&&this.uri&&(this.ready=!0,this.onConnect?.())},this.onConnect=()=>{if(this.wallet?.mobile_link&&this.uri)try{this.error=!1;const{mobile_link:e,name:n}=this.wallet,{redirect:i,href:o}=A.formatNativeUrl(e,this.uri);D.setWcLinking({name:n,href:o}),D.setRecentWallet(this.wallet);const t=A.isIframe()?"_top":"_self";A.openHref(i,t),clearTimeout(this.labelTimeout),this.secondaryLabel=Oe.CONNECT_LABELS.MOBILE}catch(e){ee.sendEvent({type:"track",event:"CONNECT_PROXY_ERROR",properties:{message:e instanceof Error?e.message:"Error parsing the deeplink",uri:this.uri,mobile_link:this.wallet.mobile_link,name:this.wallet.name}}),this.error=!0}},!this.wallet)throw new Error("w3m-connecting-wc-mobile: No wallet provided");this.secondaryBtnLabel=void 0,this.secondaryLabel=Oe.CONNECT_LABELS.MOBILE,document.addEventListener("visibilitychange",this.onBuffering.bind(this)),ee.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"mobile"}}),this.btnLabelTimeout=setTimeout(()=>{this.secondaryBtnLabel="Try again",this.secondaryLabel=Oe.CONNECT_LABELS.MOBILE},Oe.FIVE_SEC_MS),this.labelTimeout=setTimeout(()=>{this.secondaryLabel="Hold tight... it's taking longer than expected"},Oe.THREE_SEC_MS)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("visibilitychange",this.onBuffering.bind(this)),clearTimeout(this.btnLabelTimeout),clearTimeout(this.labelTimeout)}onBuffering(){const e=A.isIos();document?.visibilityState==="visible"&&!this.error&&e&&(D.setBuffering(!0),setTimeout(()=>{D.setBuffering(!1)},5e3))}onTryAgain(){this.buffering||(D.setWcError(!1),this.onConnect())}};Rn=Ui([S("w3m-connecting-wc-mobile")],Rn);var _e={},Et,$n;function qi(){return $n||($n=1,Et=function(){return typeof Promise=="function"&&Promise.prototype&&Promise.prototype.then}),Et}var Wt={},we={},In;function Ie(){if(In)return we;In=1;let r;const e=[0,26,44,70,100,134,172,196,242,292,346,404,466,532,581,655,733,815,901,991,1085,1156,1258,1364,1474,1588,1706,1828,1921,2051,2185,2323,2465,2611,2761,2876,3034,3196,3362,3532,3706];return we.getSymbolSize=function(i){if(!i)throw new Error('"version" cannot be null or undefined');if(i<1||i>40)throw new Error('"version" should be in range from 1 to 40');return i*4+17},we.getSymbolTotalCodewords=function(i){return e[i]},we.getBCHDigit=function(n){let i=0;for(;n!==0;)i++,n>>>=1;return i},we.setToSJISFunction=function(i){if(typeof i!="function")throw new Error('"toSJISFunc" is not a valid function.');r=i},we.isKanjiModeEnabled=function(){return typeof r<"u"},we.toSJIS=function(i){return r(i)},we}var _t={},En;function un(){return En||(En=1,(function(r){r.L={bit:1},r.M={bit:0},r.Q={bit:3},r.H={bit:2};function e(n){if(typeof n!="string")throw new Error("Param is not a string");switch(n.toLowerCase()){case"l":case"low":return r.L;case"m":case"medium":return r.M;case"q":case"quartile":return r.Q;case"h":case"high":return r.H;default:throw new Error("Unknown EC Level: "+n)}}r.isValid=function(i){return i&&typeof i.bit<"u"&&i.bit>=0&&i.bit<4},r.from=function(i,o){if(r.isValid(i))return i;try{return e(i)}catch{return o}}})(_t)),_t}var St,Wn;function Fi(){if(Wn)return St;Wn=1;function r(){this.buffer=[],this.length=0}return r.prototype={get:function(e){const n=Math.floor(e/8);return(this.buffer[n]>>>7-e%8&1)===1},put:function(e,n){for(let i=0;i<n;i++)this.putBit((e>>>n-i-1&1)===1)},getLengthInBits:function(){return this.length},putBit:function(e){const n=Math.floor(this.length/8);this.buffer.length<=n&&this.buffer.push(0),e&&(this.buffer[n]|=128>>>this.length%8),this.length++}},St=r,St}var Tt,_n;function Vi(){if(_n)return Tt;_n=1;function r(e){if(!e||e<1)throw new Error("BitMatrix size must be defined and greater than 0");this.size=e,this.data=new Uint8Array(e*e),this.reservedBit=new Uint8Array(e*e)}return r.prototype.set=function(e,n,i,o){const t=e*this.size+n;this.data[t]=i,o&&(this.reservedBit[t]=!0)},r.prototype.get=function(e,n){return this.data[e*this.size+n]},r.prototype.xor=function(e,n,i){this.data[e*this.size+n]^=i},r.prototype.isReserved=function(e,n){return this.reservedBit[e*this.size+n]},Tt=r,Tt}var Bt={},Sn;function Ki(){return Sn||(Sn=1,(function(r){const e=Ie().getSymbolSize;r.getRowColCoords=function(i){if(i===1)return[];const o=Math.floor(i/7)+2,t=e(i),a=t===145?26:Math.ceil((t-13)/(2*o-2))*2,s=[t-7];for(let l=1;l<o-1;l++)s[l]=s[l-1]-a;return s.push(6),s.reverse()},r.getPositions=function(i){const o=[],t=r.getRowColCoords(i),a=t.length;for(let s=0;s<a;s++)for(let l=0;l<a;l++)s===0&&l===0||s===0&&l===a-1||s===a-1&&l===0||o.push([t[s],t[l]]);return o}})(Bt)),Bt}var Pt={},Tn;function Hi(){if(Tn)return Pt;Tn=1;const r=Ie().getSymbolSize,e=7;return Pt.getPositions=function(i){const o=r(i);return[[0,0],[o-e,0],[0,o-e]]},Pt}var Lt={},Bn;function Gi(){return Bn||(Bn=1,(function(r){r.Patterns={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7};const e={N1:3,N2:3,N3:40,N4:10};r.isValid=function(o){return o!=null&&o!==""&&!isNaN(o)&&o>=0&&o<=7},r.from=function(o){return r.isValid(o)?parseInt(o,10):void 0},r.getPenaltyN1=function(o){const t=o.size;let a=0,s=0,l=0,d=null,p=null;for(let w=0;w<t;w++){s=l=0,d=p=null;for(let C=0;C<t;C++){let g=o.get(w,C);g===d?s++:(s>=5&&(a+=e.N1+(s-5)),d=g,s=1),g=o.get(C,w),g===p?l++:(l>=5&&(a+=e.N1+(l-5)),p=g,l=1)}s>=5&&(a+=e.N1+(s-5)),l>=5&&(a+=e.N1+(l-5))}return a},r.getPenaltyN2=function(o){const t=o.size;let a=0;for(let s=0;s<t-1;s++)for(let l=0;l<t-1;l++){const d=o.get(s,l)+o.get(s,l+1)+o.get(s+1,l)+o.get(s+1,l+1);(d===4||d===0)&&a++}return a*e.N2},r.getPenaltyN3=function(o){const t=o.size;let a=0,s=0,l=0;for(let d=0;d<t;d++){s=l=0;for(let p=0;p<t;p++)s=s<<1&2047|o.get(d,p),p>=10&&(s===1488||s===93)&&a++,l=l<<1&2047|o.get(p,d),p>=10&&(l===1488||l===93)&&a++}return a*e.N3},r.getPenaltyN4=function(o){let t=0;const a=o.data.length;for(let l=0;l<a;l++)t+=o.data[l];return Math.abs(Math.ceil(t*100/a/5)-10)*e.N4};function n(i,o,t){switch(i){case r.Patterns.PATTERN000:return(o+t)%2===0;case r.Patterns.PATTERN001:return o%2===0;case r.Patterns.PATTERN010:return t%3===0;case r.Patterns.PATTERN011:return(o+t)%3===0;case r.Patterns.PATTERN100:return(Math.floor(o/2)+Math.floor(t/3))%2===0;case r.Patterns.PATTERN101:return o*t%2+o*t%3===0;case r.Patterns.PATTERN110:return(o*t%2+o*t%3)%2===0;case r.Patterns.PATTERN111:return(o*t%3+(o+t)%2)%2===0;default:throw new Error("bad maskPattern:"+i)}}r.applyMask=function(o,t){const a=t.size;for(let s=0;s<a;s++)for(let l=0;l<a;l++)t.isReserved(l,s)||t.xor(l,s,n(o,l,s))},r.getBestMask=function(o,t){const a=Object.keys(r.Patterns).length;let s=0,l=1/0;for(let d=0;d<a;d++){t(d),r.applyMask(d,o);const p=r.getPenaltyN1(o)+r.getPenaltyN2(o)+r.getPenaltyN3(o)+r.getPenaltyN4(o);r.applyMask(d,o),p<l&&(l=p,s=d)}return s}})(Lt)),Lt}var Ye={},Pn;function ai(){if(Pn)return Ye;Pn=1;const r=un(),e=[1,1,1,1,1,1,1,1,1,1,2,2,1,2,2,4,1,2,4,4,2,4,4,4,2,4,6,5,2,4,6,6,2,5,8,8,4,5,8,8,4,5,8,11,4,8,10,11,4,9,12,16,4,9,16,16,6,10,12,18,6,10,17,16,6,11,16,19,6,13,18,21,7,14,21,25,8,16,20,25,8,17,23,25,9,17,23,34,9,18,25,30,10,20,27,32,12,21,29,35,12,23,34,37,12,25,34,40,13,26,35,42,14,28,38,45,15,29,40,48,16,31,43,51,17,33,45,54,18,35,48,57,19,37,51,60,19,38,53,63,20,40,56,66,21,43,59,70,22,45,62,74,24,47,65,77,25,49,68,81],n=[7,10,13,17,10,16,22,28,15,26,36,44,20,36,52,64,26,48,72,88,36,64,96,112,40,72,108,130,48,88,132,156,60,110,160,192,72,130,192,224,80,150,224,264,96,176,260,308,104,198,288,352,120,216,320,384,132,240,360,432,144,280,408,480,168,308,448,532,180,338,504,588,196,364,546,650,224,416,600,700,224,442,644,750,252,476,690,816,270,504,750,900,300,560,810,960,312,588,870,1050,336,644,952,1110,360,700,1020,1200,390,728,1050,1260,420,784,1140,1350,450,812,1200,1440,480,868,1290,1530,510,924,1350,1620,540,980,1440,1710,570,1036,1530,1800,570,1064,1590,1890,600,1120,1680,1980,630,1204,1770,2100,660,1260,1860,2220,720,1316,1950,2310,750,1372,2040,2430];return Ye.getBlocksCount=function(o,t){switch(t){case r.L:return e[(o-1)*4+0];case r.M:return e[(o-1)*4+1];case r.Q:return e[(o-1)*4+2];case r.H:return e[(o-1)*4+3];default:return}},Ye.getTotalCodewordsCount=function(o,t){switch(t){case r.L:return n[(o-1)*4+0];case r.M:return n[(o-1)*4+1];case r.Q:return n[(o-1)*4+2];case r.H:return n[(o-1)*4+3];default:return}},Ye}var Ot={},Ae={},Ln;function Yi(){if(Ln)return Ae;Ln=1;const r=new Uint8Array(512),e=new Uint8Array(256);return(function(){let i=1;for(let o=0;o<255;o++)r[o]=i,e[i]=o,i<<=1,i&256&&(i^=285);for(let o=255;o<512;o++)r[o]=r[o-255]})(),Ae.log=function(i){if(i<1)throw new Error("log("+i+")");return e[i]},Ae.exp=function(i){return r[i]},Ae.mul=function(i,o){return i===0||o===0?0:r[e[i]+e[o]]},Ae}var On;function Ji(){return On||(On=1,(function(r){const e=Yi();r.mul=function(i,o){const t=new Uint8Array(i.length+o.length-1);for(let a=0;a<i.length;a++)for(let s=0;s<o.length;s++)t[a+s]^=e.mul(i[a],o[s]);return t},r.mod=function(i,o){let t=new Uint8Array(i);for(;t.length-o.length>=0;){const a=t[0];for(let l=0;l<o.length;l++)t[l]^=e.mul(o[l],a);let s=0;for(;s<t.length&&t[s]===0;)s++;t=t.slice(s)}return t},r.generateECPolynomial=function(i){let o=new Uint8Array([1]);for(let t=0;t<i;t++)o=r.mul(o,new Uint8Array([1,e.exp(t)]));return o}})(Ot)),Ot}var At,An;function Qi(){if(An)return At;An=1;const r=Ji();function e(n){this.genPoly=void 0,this.degree=n,this.degree&&this.initialize(this.degree)}return e.prototype.initialize=function(i){this.degree=i,this.genPoly=r.generateECPolynomial(this.degree)},e.prototype.encode=function(i){if(!this.genPoly)throw new Error("Encoder not initialized");const o=new Uint8Array(i.length+this.degree);o.set(i);const t=r.mod(o,this.genPoly),a=this.degree-t.length;if(a>0){const s=new Uint8Array(this.degree);return s.set(t,a),s}return t},At=e,At}var jt={},Dt={},zt={},jn;function si(){return jn||(jn=1,zt.isValid=function(e){return!isNaN(e)&&e>=1&&e<=40}),zt}var oe={},Dn;function li(){if(Dn)return oe;Dn=1;const r="[0-9]+",e="[A-Z $%*+\\-./:]+";let n="(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+";n=n.replace(/u/g,"\\u");const i="(?:(?![A-Z0-9 $%*+\\-./:]|"+n+`)(?:.|[\r
]))+`;oe.KANJI=new RegExp(n,"g"),oe.BYTE_KANJI=new RegExp("[^A-Z0-9 $%*+\\-./:]+","g"),oe.BYTE=new RegExp(i,"g"),oe.NUMERIC=new RegExp(r,"g"),oe.ALPHANUMERIC=new RegExp(e,"g");const o=new RegExp("^"+n+"$"),t=new RegExp("^"+r+"$"),a=new RegExp("^[A-Z0-9 $%*+\\-./:]+$");return oe.testKanji=function(l){return o.test(l)},oe.testNumeric=function(l){return t.test(l)},oe.testAlphanumeric=function(l){return a.test(l)},oe}var zn;function Ee(){return zn||(zn=1,(function(r){const e=si(),n=li();r.NUMERIC={id:"Numeric",bit:1,ccBits:[10,12,14]},r.ALPHANUMERIC={id:"Alphanumeric",bit:2,ccBits:[9,11,13]},r.BYTE={id:"Byte",bit:4,ccBits:[8,16,16]},r.KANJI={id:"Kanji",bit:8,ccBits:[8,10,12]},r.MIXED={bit:-1},r.getCharCountIndicator=function(t,a){if(!t.ccBits)throw new Error("Invalid mode: "+t);if(!e.isValid(a))throw new Error("Invalid version: "+a);return a>=1&&a<10?t.ccBits[0]:a<27?t.ccBits[1]:t.ccBits[2]},r.getBestModeForData=function(t){return n.testNumeric(t)?r.NUMERIC:n.testAlphanumeric(t)?r.ALPHANUMERIC:n.testKanji(t)?r.KANJI:r.BYTE},r.toString=function(t){if(t&&t.id)return t.id;throw new Error("Invalid mode")},r.isValid=function(t){return t&&t.bit&&t.ccBits};function i(o){if(typeof o!="string")throw new Error("Param is not a string");switch(o.toLowerCase()){case"numeric":return r.NUMERIC;case"alphanumeric":return r.ALPHANUMERIC;case"kanji":return r.KANJI;case"byte":return r.BYTE;default:throw new Error("Unknown mode: "+o)}}r.from=function(t,a){if(r.isValid(t))return t;try{return i(t)}catch{return a}}})(Dt)),Dt}var kn;function Xi(){return kn||(kn=1,(function(r){const e=Ie(),n=ai(),i=un(),o=Ee(),t=si(),a=7973,s=e.getBCHDigit(a);function l(C,g,L){for(let y=1;y<=40;y++)if(g<=r.getCapacity(y,L,C))return y}function d(C,g){return o.getCharCountIndicator(C,g)+4}function p(C,g){let L=0;return C.forEach(function(y){const T=d(y.mode,g);L+=T+y.getBitsLength()}),L}function w(C,g){for(let L=1;L<=40;L++)if(p(C,L)<=r.getCapacity(L,g,o.MIXED))return L}r.from=function(g,L){return t.isValid(g)?parseInt(g,10):L},r.getCapacity=function(g,L,y){if(!t.isValid(g))throw new Error("Invalid QR Code version");typeof y>"u"&&(y=o.BYTE);const T=e.getSymbolTotalCodewords(g),m=n.getTotalCodewordsCount(g,L),f=(T-m)*8;if(y===o.MIXED)return f;const b=f-d(y,g);switch(y){case o.NUMERIC:return Math.floor(b/10*3);case o.ALPHANUMERIC:return Math.floor(b/11*2);case o.KANJI:return Math.floor(b/13);case o.BYTE:default:return Math.floor(b/8)}},r.getBestVersionForData=function(g,L){let y;const T=i.from(L,i.M);if(Array.isArray(g)){if(g.length>1)return w(g,T);if(g.length===0)return 1;y=g[0]}else y=g;return l(y.mode,y.getLength(),T)},r.getEncodedBits=function(g){if(!t.isValid(g)||g<7)throw new Error("Invalid QR Code version");let L=g<<12;for(;e.getBCHDigit(L)-s>=0;)L^=a<<e.getBCHDigit(L)-s;return g<<12|L}})(jt)),jt}var kt={},Nn;function Zi(){if(Nn)return kt;Nn=1;const r=Ie(),e=1335,n=21522,i=r.getBCHDigit(e);return kt.getEncodedBits=function(t,a){const s=t.bit<<3|a;let l=s<<10;for(;r.getBCHDigit(l)-i>=0;)l^=e<<r.getBCHDigit(l)-i;return(s<<10|l)^n},kt}var Nt={},Mt,Mn;function eo(){if(Mn)return Mt;Mn=1;const r=Ee();function e(n){this.mode=r.NUMERIC,this.data=n.toString()}return e.getBitsLength=function(i){return 10*Math.floor(i/3)+(i%3?i%3*3+1:0)},e.prototype.getLength=function(){return this.data.length},e.prototype.getBitsLength=function(){return e.getBitsLength(this.data.length)},e.prototype.write=function(i){let o,t,a;for(o=0;o+3<=this.data.length;o+=3)t=this.data.substr(o,3),a=parseInt(t,10),i.put(a,10);const s=this.data.length-o;s>0&&(t=this.data.substr(o),a=parseInt(t,10),i.put(a,s*3+1))},Mt=e,Mt}var Ut,Un;function to(){if(Un)return Ut;Un=1;const r=Ee(),e=["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"," ","$","%","*","+","-",".","/",":"];function n(i){this.mode=r.ALPHANUMERIC,this.data=i}return n.getBitsLength=function(o){return 11*Math.floor(o/2)+6*(o%2)},n.prototype.getLength=function(){return this.data.length},n.prototype.getBitsLength=function(){return n.getBitsLength(this.data.length)},n.prototype.write=function(o){let t;for(t=0;t+2<=this.data.length;t+=2){let a=e.indexOf(this.data[t])*45;a+=e.indexOf(this.data[t+1]),o.put(a,11)}this.data.length%2&&o.put(e.indexOf(this.data[t]),6)},Ut=n,Ut}var qt,qn;function no(){return qn||(qn=1,qt=function(e){for(var n=[],i=e.length,o=0;o<i;o++){var t=e.charCodeAt(o);if(t>=55296&&t<=56319&&i>o+1){var a=e.charCodeAt(o+1);a>=56320&&a<=57343&&(t=(t-55296)*1024+a-56320+65536,o+=1)}if(t<128){n.push(t);continue}if(t<2048){n.push(t>>6|192),n.push(t&63|128);continue}if(t<55296||t>=57344&&t<65536){n.push(t>>12|224),n.push(t>>6&63|128),n.push(t&63|128);continue}if(t>=65536&&t<=1114111){n.push(t>>18|240),n.push(t>>12&63|128),n.push(t>>6&63|128),n.push(t&63|128);continue}n.push(239,191,189)}return new Uint8Array(n).buffer}),qt}var Ft,Fn;function io(){if(Fn)return Ft;Fn=1;const r=no(),e=Ee();function n(i){this.mode=e.BYTE,typeof i=="string"&&(i=r(i)),this.data=new Uint8Array(i)}return n.getBitsLength=function(o){return o*8},n.prototype.getLength=function(){return this.data.length},n.prototype.getBitsLength=function(){return n.getBitsLength(this.data.length)},n.prototype.write=function(i){for(let o=0,t=this.data.length;o<t;o++)i.put(this.data[o],8)},Ft=n,Ft}var Vt,Vn;function oo(){if(Vn)return Vt;Vn=1;const r=Ee(),e=Ie();function n(i){this.mode=r.KANJI,this.data=i}return n.getBitsLength=function(o){return o*13},n.prototype.getLength=function(){return this.data.length},n.prototype.getBitsLength=function(){return n.getBitsLength(this.data.length)},n.prototype.write=function(i){let o;for(o=0;o<this.data.length;o++){let t=e.toSJIS(this.data[o]);if(t>=33088&&t<=40956)t-=33088;else if(t>=57408&&t<=60351)t-=49472;else throw new Error("Invalid SJIS character: "+this.data[o]+`
Make sure your charset is UTF-8`);t=(t>>>8&255)*192+(t&255),i.put(t,13)}},Vt=n,Vt}var Kn;function ro(){return Kn||(Kn=1,(function(r){const e=Ee(),n=eo(),i=to(),o=io(),t=oo(),a=li(),s=Ie(),l=Ii();function d(m){return unescape(encodeURIComponent(m)).length}function p(m,f,b){const h=[];let z;for(;(z=m.exec(b))!==null;)h.push({data:z[0],index:z.index,mode:f,length:z[0].length});return h}function w(m){const f=p(a.NUMERIC,e.NUMERIC,m),b=p(a.ALPHANUMERIC,e.ALPHANUMERIC,m);let h,z;return s.isKanjiModeEnabled()?(h=p(a.BYTE,e.BYTE,m),z=p(a.KANJI,e.KANJI,m)):(h=p(a.BYTE_KANJI,e.BYTE,m),z=[]),f.concat(b,h,z).sort(function(W,I){return W.index-I.index}).map(function(W){return{data:W.data,mode:W.mode,length:W.length}})}function C(m,f){switch(f){case e.NUMERIC:return n.getBitsLength(m);case e.ALPHANUMERIC:return i.getBitsLength(m);case e.KANJI:return t.getBitsLength(m);case e.BYTE:return o.getBitsLength(m)}}function g(m){return m.reduce(function(f,b){const h=f.length-1>=0?f[f.length-1]:null;return h&&h.mode===b.mode?(f[f.length-1].data+=b.data,f):(f.push(b),f)},[])}function L(m){const f=[];for(let b=0;b<m.length;b++){const h=m[b];switch(h.mode){case e.NUMERIC:f.push([h,{data:h.data,mode:e.ALPHANUMERIC,length:h.length},{data:h.data,mode:e.BYTE,length:h.length}]);break;case e.ALPHANUMERIC:f.push([h,{data:h.data,mode:e.BYTE,length:h.length}]);break;case e.KANJI:f.push([h,{data:h.data,mode:e.BYTE,length:d(h.data)}]);break;case e.BYTE:f.push([{data:h.data,mode:e.BYTE,length:d(h.data)}])}}return f}function y(m,f){const b={},h={start:{}};let z=["start"];for(let x=0;x<m.length;x++){const W=m[x],I=[];for(let v=0;v<W.length;v++){const B=W[v],R=""+x+v;I.push(R),b[R]={node:B,lastCount:0},h[R]={};for(let _=0;_<z.length;_++){const $=z[_];b[$]&&b[$].node.mode===B.mode?(h[$][R]=C(b[$].lastCount+B.length,B.mode)-C(b[$].lastCount,B.mode),b[$].lastCount+=B.length):(b[$]&&(b[$].lastCount=B.length),h[$][R]=C(B.length,B.mode)+4+e.getCharCountIndicator(B.mode,f))}}z=I}for(let x=0;x<z.length;x++)h[z[x]].end=0;return{map:h,table:b}}function T(m,f){let b;const h=e.getBestModeForData(m);if(b=e.from(f,h),b!==e.BYTE&&b.bit<h.bit)throw new Error('"'+m+'" cannot be encoded with mode '+e.toString(b)+`.
 Suggested mode is: `+e.toString(h));switch(b===e.KANJI&&!s.isKanjiModeEnabled()&&(b=e.BYTE),b){case e.NUMERIC:return new n(m);case e.ALPHANUMERIC:return new i(m);case e.KANJI:return new t(m);case e.BYTE:return new o(m)}}r.fromArray=function(f){return f.reduce(function(b,h){return typeof h=="string"?b.push(T(h,null)):h.data&&b.push(T(h.data,h.mode)),b},[])},r.fromString=function(f,b){const h=w(f,s.isKanjiModeEnabled()),z=L(h),x=y(z,b),W=l.find_path(x.map,"start","end"),I=[];for(let v=1;v<W.length-1;v++)I.push(x.table[W[v]].node);return r.fromArray(g(I))},r.rawSplit=function(f){return r.fromArray(w(f,s.isKanjiModeEnabled()))}})(Nt)),Nt}var Hn;function ao(){if(Hn)return Wt;Hn=1;const r=Ie(),e=un(),n=Fi(),i=Vi(),o=Ki(),t=Hi(),a=Gi(),s=ai(),l=Qi(),d=Xi(),p=Zi(),w=Ee(),C=ro();function g(x,W){const I=x.size,v=t.getPositions(W);for(let B=0;B<v.length;B++){const R=v[B][0],_=v[B][1];for(let $=-1;$<=7;$++)if(!(R+$<=-1||I<=R+$))for(let j=-1;j<=7;j++)_+j<=-1||I<=_+j||($>=0&&$<=6&&(j===0||j===6)||j>=0&&j<=6&&($===0||$===6)||$>=2&&$<=4&&j>=2&&j<=4?x.set(R+$,_+j,!0,!0):x.set(R+$,_+j,!1,!0))}}function L(x){const W=x.size;for(let I=8;I<W-8;I++){const v=I%2===0;x.set(I,6,v,!0),x.set(6,I,v,!0)}}function y(x,W){const I=o.getPositions(W);for(let v=0;v<I.length;v++){const B=I[v][0],R=I[v][1];for(let _=-2;_<=2;_++)for(let $=-2;$<=2;$++)_===-2||_===2||$===-2||$===2||_===0&&$===0?x.set(B+_,R+$,!0,!0):x.set(B+_,R+$,!1,!0)}}function T(x,W){const I=x.size,v=d.getEncodedBits(W);let B,R,_;for(let $=0;$<18;$++)B=Math.floor($/3),R=$%3+I-8-3,_=(v>>$&1)===1,x.set(B,R,_,!0),x.set(R,B,_,!0)}function m(x,W,I){const v=x.size,B=p.getEncodedBits(W,I);let R,_;for(R=0;R<15;R++)_=(B>>R&1)===1,R<6?x.set(R,8,_,!0):R<8?x.set(R+1,8,_,!0):x.set(v-15+R,8,_,!0),R<8?x.set(8,v-R-1,_,!0):R<9?x.set(8,15-R-1+1,_,!0):x.set(8,15-R-1,_,!0);x.set(v-8,8,1,!0)}function f(x,W){const I=x.size;let v=-1,B=I-1,R=7,_=0;for(let $=I-1;$>0;$-=2)for($===6&&$--;;){for(let j=0;j<2;j++)if(!x.isReserved(B,$-j)){let ge=!1;_<W.length&&(ge=(W[_]>>>R&1)===1),x.set(B,$-j,ge),R--,R===-1&&(_++,R=7)}if(B+=v,B<0||I<=B){B-=v,v=-v;break}}}function b(x,W,I){const v=new n;I.forEach(function(j){v.put(j.mode.bit,4),v.put(j.getLength(),w.getCharCountIndicator(j.mode,x)),j.write(v)});const B=r.getSymbolTotalCodewords(x),R=s.getTotalCodewordsCount(x,W),_=(B-R)*8;for(v.getLengthInBits()+4<=_&&v.put(0,4);v.getLengthInBits()%8!==0;)v.putBit(0);const $=(_-v.getLengthInBits())/8;for(let j=0;j<$;j++)v.put(j%2?17:236,8);return h(v,x,W)}function h(x,W,I){const v=r.getSymbolTotalCodewords(W),B=s.getTotalCodewordsCount(W,I),R=v-B,_=s.getBlocksCount(W,I),$=v%_,j=_-$,ge=Math.floor(v/_),Le=Math.floor(R/_),wi=Le+1,pn=ge-Le,bi=new l(pn);let xt=0;const Ge=new Array(_),gn=new Array(_);let Ct=0;const mi=new Uint8Array(x.buffer);for(let We=0;We<_;We++){const $t=We<j?Le:wi;Ge[We]=mi.slice(xt,xt+$t),gn[We]=bi.encode(Ge[We]),xt+=$t,Ct=Math.max(Ct,$t)}const Rt=new Uint8Array(v);let wn=0,le,ce;for(le=0;le<Ct;le++)for(ce=0;ce<_;ce++)le<Ge[ce].length&&(Rt[wn++]=Ge[ce][le]);for(le=0;le<pn;le++)for(ce=0;ce<_;ce++)Rt[wn++]=gn[ce][le];return Rt}function z(x,W,I,v){let B;if(Array.isArray(x))B=C.fromArray(x);else if(typeof x=="string"){let ge=W;if(!ge){const Le=C.rawSplit(x);ge=d.getBestVersionForData(Le,I)}B=C.fromString(x,ge||40)}else throw new Error("Invalid data");const R=d.getBestVersionForData(B,I);if(!R)throw new Error("The amount of data is too big to be stored in a QR Code");if(!W)W=R;else if(W<R)throw new Error(`
The chosen QR Code version cannot contain this amount of data.
Minimum version required to store current data is: `+R+`.
`);const _=b(W,I,B),$=r.getSymbolSize(W),j=new i($);return g(j,W),L(j),y(j,W),m(j,I,0),W>=7&&T(j,W),f(j,_),isNaN(v)&&(v=a.getBestMask(j,m.bind(null,j,I))),a.applyMask(v,j),m(j,I,v),{modules:j,version:W,errorCorrectionLevel:I,maskPattern:v,segments:B}}return Wt.create=function(W,I){if(typeof W>"u"||W==="")throw new Error("No input text");let v=e.M,B,R;return typeof I<"u"&&(v=e.from(I.errorCorrectionLevel,e.M),B=d.from(I.version),R=a.from(I.maskPattern),I.toSJISFunc&&r.setToSJISFunction(I.toSJISFunc)),z(W,B,v,R)},Wt}var Kt={},Ht={},Gn;function ci(){return Gn||(Gn=1,(function(r){function e(n){if(typeof n=="number"&&(n=n.toString()),typeof n!="string")throw new Error("Color should be defined as hex string");let i=n.slice().replace("#","").split("");if(i.length<3||i.length===5||i.length>8)throw new Error("Invalid hex color: "+n);(i.length===3||i.length===4)&&(i=Array.prototype.concat.apply([],i.map(function(t){return[t,t]}))),i.length===6&&i.push("F","F");const o=parseInt(i.join(""),16);return{r:o>>24&255,g:o>>16&255,b:o>>8&255,a:o&255,hex:"#"+i.slice(0,6).join("")}}r.getOptions=function(i){i||(i={}),i.color||(i.color={});const o=typeof i.margin>"u"||i.margin===null||i.margin<0?4:i.margin,t=i.width&&i.width>=21?i.width:void 0,a=i.scale||4;return{width:t,scale:t?4:a,margin:o,color:{dark:e(i.color.dark||"#000000ff"),light:e(i.color.light||"#ffffffff")},type:i.type,rendererOpts:i.rendererOpts||{}}},r.getScale=function(i,o){return o.width&&o.width>=i+o.margin*2?o.width/(i+o.margin*2):o.scale},r.getImageWidth=function(i,o){const t=r.getScale(i,o);return Math.floor((i+o.margin*2)*t)},r.qrToImageData=function(i,o,t){const a=o.modules.size,s=o.modules.data,l=r.getScale(a,t),d=Math.floor((a+t.margin*2)*l),p=t.margin*l,w=[t.color.light,t.color.dark];for(let C=0;C<d;C++)for(let g=0;g<d;g++){let L=(C*d+g)*4,y=t.color.light;if(C>=p&&g>=p&&C<d-p&&g<d-p){const T=Math.floor((C-p)/l),m=Math.floor((g-p)/l);y=w[s[T*a+m]?1:0]}i[L++]=y.r,i[L++]=y.g,i[L++]=y.b,i[L]=y.a}}})(Ht)),Ht}var Yn;function so(){return Yn||(Yn=1,(function(r){const e=ci();function n(o,t,a){o.clearRect(0,0,t.width,t.height),t.style||(t.style={}),t.height=a,t.width=a,t.style.height=a+"px",t.style.width=a+"px"}function i(){try{return document.createElement("canvas")}catch{throw new Error("You need to specify a canvas element")}}r.render=function(t,a,s){let l=s,d=a;typeof l>"u"&&(!a||!a.getContext)&&(l=a,a=void 0),a||(d=i()),l=e.getOptions(l);const p=e.getImageWidth(t.modules.size,l),w=d.getContext("2d"),C=w.createImageData(p,p);return e.qrToImageData(C.data,t,l),n(w,d,p),w.putImageData(C,0,0),d},r.renderToDataURL=function(t,a,s){let l=s;typeof l>"u"&&(!a||!a.getContext)&&(l=a,a=void 0),l||(l={});const d=r.render(t,a,l),p=l.type||"image/png",w=l.rendererOpts||{};return d.toDataURL(p,w.quality)}})(Kt)),Kt}var Gt={},Jn;function lo(){if(Jn)return Gt;Jn=1;const r=ci();function e(o,t){const a=o.a/255,s=t+'="'+o.hex+'"';return a<1?s+" "+t+'-opacity="'+a.toFixed(2).slice(1)+'"':s}function n(o,t,a){let s=o+t;return typeof a<"u"&&(s+=" "+a),s}function i(o,t,a){let s="",l=0,d=!1,p=0;for(let w=0;w<o.length;w++){const C=Math.floor(w%t),g=Math.floor(w/t);!C&&!d&&(d=!0),o[w]?(p++,w>0&&C>0&&o[w-1]||(s+=d?n("M",C+a,.5+g+a):n("m",l,0),l=0,d=!1),C+1<t&&o[w+1]||(s+=n("h",p),p=0)):l++}return s}return Gt.render=function(t,a,s){const l=r.getOptions(a),d=t.modules.size,p=t.modules.data,w=d+l.margin*2,C=l.color.light.a?"<path "+e(l.color.light,"fill")+' d="M0 0h'+w+"v"+w+'H0z"/>':"",g="<path "+e(l.color.dark,"stroke")+' d="'+i(p,d,l.margin)+'"/>',L='viewBox="0 0 '+w+" "+w+'"',T='<svg xmlns="http://www.w3.org/2000/svg" '+(l.width?'width="'+l.width+'" height="'+l.width+'" ':"")+L+' shape-rendering="crispEdges">'+C+g+`</svg>
`;return typeof s=="function"&&s(null,T),T},Gt}var Qn;function co(){if(Qn)return _e;Qn=1;const r=qi(),e=ao(),n=so(),i=lo();function o(t,a,s,l,d){const p=[].slice.call(arguments,1),w=p.length,C=typeof p[w-1]=="function";if(!C&&!r())throw new Error("Callback required as last argument");if(C){if(w<2)throw new Error("Too few arguments provided");w===2?(d=s,s=a,a=l=void 0):w===3&&(a.getContext&&typeof d>"u"?(d=l,l=void 0):(d=l,l=s,s=a,a=void 0))}else{if(w<1)throw new Error("Too few arguments provided");return w===1?(s=a,a=l=void 0):w===2&&!a.getContext&&(l=s,s=a,a=void 0),new Promise(function(g,L){try{const y=e.create(s,l);g(t(y,a,l))}catch(y){L(y)}})}try{const g=e.create(s,l);d(null,t(g,a,l))}catch(g){d(g)}}return _e.create=e.create,_e.toCanvas=o.bind(null,n.render),_e.toDataURL=o.bind(null,n.renderToDataURL),_e.toString=o.bind(null,function(t,a,s){return i.render(t,s)}),_e}var uo=co();const ho=$i(uo),fo=.1,Xn=2.5,ue=7;function Yt(r,e,n){return r===e?!1:(r-e<0?e-r:r-e)<=n+fo}function po(r,e){const n=Array.prototype.slice.call(ho.create(r,{errorCorrectionLevel:e}).modules.data,0),i=Math.sqrt(n.length);return n.reduce((o,t,a)=>(a%i===0?o.push([t]):o[o.length-1].push(t))&&o,[])}const go={generate({uri:r,size:e,logoSize:n,dotColor:i="#141414"}){const o="transparent",a=[],s=po(r,"Q"),l=e/s.length,d=[{x:0,y:0},{x:1,y:0},{x:0,y:1}];d.forEach(({x:y,y:T})=>{const m=(s.length-ue)*l*y,f=(s.length-ue)*l*T,b=.45;for(let h=0;h<d.length;h+=1){const z=l*(ue-h*2);a.push(je`
            <rect
              fill=${h===2?i:o}
              width=${h===0?z-5:z}
              rx= ${h===0?(z-5)*b:z*b}
              ry= ${h===0?(z-5)*b:z*b}
              stroke=${i}
              stroke-width=${h===0?5:0}
              height=${h===0?z-5:z}
              x= ${h===0?f+l*h+5/2:f+l*h}
              y= ${h===0?m+l*h+5/2:m+l*h}
            />
          `)}});const p=Math.floor((n+25)/l),w=s.length/2-p/2,C=s.length/2+p/2-1,g=[];s.forEach((y,T)=>{y.forEach((m,f)=>{if(s[T][f]&&!(T<ue&&f<ue||T>s.length-(ue+1)&&f<ue||T<ue&&f>s.length-(ue+1))&&!(T>w&&T<C&&f>w&&f<C)){const b=T*l+l/2,h=f*l+l/2;g.push([b,h])}})});const L={};return g.forEach(([y,T])=>{L[y]?L[y]?.push(T):L[y]=[T]}),Object.entries(L).map(([y,T])=>{const m=T.filter(f=>T.every(b=>!Yt(f,b,l)));return[Number(y),m]}).forEach(([y,T])=>{T.forEach(m=>{a.push(je`<circle cx=${y} cy=${m} fill=${i} r=${l/Xn} />`)})}),Object.entries(L).filter(([y,T])=>T.length>1).map(([y,T])=>{const m=T.filter(f=>T.some(b=>Yt(f,b,l)));return[Number(y),m]}).map(([y,T])=>{T.sort((f,b)=>f<b?-1:1);const m=[];for(const f of T){const b=m.find(h=>h.some(z=>Yt(f,z,l)));b?b.push(f):m.push([f])}return[y,m.map(f=>[f[0],f[f.length-1]])]}).forEach(([y,T])=>{T.forEach(([m,f])=>{a.push(je`
              <line
                x1=${y}
                x2=${y}
                y1=${m}
                y2=${f}
                stroke=${i}
                stroke-width=${l/(Xn/2)}
                stroke-linecap="round"
              />
            `)})}),a}},wo=k`
  :host {
    position: relative;
    user-select: none;
    display: block;
    overflow: hidden;
    aspect-ratio: 1 / 1;
    width: var(--local-size);
  }

  :host([data-theme='dark']) {
    border-radius: clamp(0px, var(--wui-border-radius-l), 40px);
    background-color: var(--wui-color-inverse-100);
    padding: var(--wui-spacing-l);
  }

  :host([data-theme='light']) {
    box-shadow: 0 0 0 1px var(--wui-color-bg-125);
    background-color: var(--wui-color-bg-125);
  }

  :host([data-clear='true']) > wui-icon {
    display: none;
  }

  svg:first-child,
  wui-image,
  wui-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translateY(-50%) translateX(-50%);
  }

  wui-image {
    width: 25%;
    height: 25%;
    border-radius: var(--wui-border-radius-xs);
  }

  wui-icon {
    width: 100%;
    height: 100%;
    color: var(--local-icon-color) !important;
    transform: translateY(-50%) translateX(-50%) scale(0.25);
  }
`;var pe=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};const bo="#3396ff";let te=class extends O{constructor(){super(...arguments),this.uri="",this.size=0,this.theme="dark",this.imageSrc=void 0,this.alt=void 0,this.arenaClear=void 0,this.farcaster=void 0}render(){return this.dataset.theme=this.theme,this.dataset.clear=String(this.arenaClear),this.style.cssText=`
     --local-size: ${this.size}px;
     --local-icon-color: ${this.color??bo}
    `,c`${this.templateVisual()} ${this.templateSvg()}`}templateSvg(){const e=this.theme==="light"?this.size:this.size-32;return je`
      <svg height=${e} width=${e}>
        ${go.generate({uri:this.uri,size:e,logoSize:this.arenaClear?0:e/4,dotColor:this.color})}
      </svg>
    `}templateVisual(){return this.imageSrc?c`<wui-image src=${this.imageSrc} alt=${this.alt??"logo"}></wui-image>`:this.farcaster?c`<wui-icon
        class="farcaster"
        size="inherit"
        color="inherit"
        name="farcaster"
      ></wui-icon>`:c`<wui-icon size="inherit" color="inherit" name="walletConnect"></wui-icon>`}};te.styles=[q,wo];pe([u()],te.prototype,"uri",void 0);pe([u({type:Number})],te.prototype,"size",void 0);pe([u()],te.prototype,"theme",void 0);pe([u()],te.prototype,"imageSrc",void 0);pe([u()],te.prototype,"alt",void 0);pe([u()],te.prototype,"color",void 0);pe([u({type:Boolean})],te.prototype,"arenaClear",void 0);pe([u({type:Boolean})],te.prototype,"farcaster",void 0);te=pe([S("wui-qr-code")],te);const mo=k`
  :host {
    display: block;
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-005);
    background: linear-gradient(
      120deg,
      var(--wui-color-bg-200) 5%,
      var(--wui-color-bg-200) 48%,
      var(--wui-color-bg-300) 55%,
      var(--wui-color-bg-300) 60%,
      var(--wui-color-bg-300) calc(60% + 10px),
      var(--wui-color-bg-200) calc(60% + 12px),
      var(--wui-color-bg-200) 100%
    );
    background-size: 250%;
    animation: shimmer 3s linear infinite reverse;
  }

  :host([variant='light']) {
    background: linear-gradient(
      120deg,
      var(--wui-color-bg-150) 5%,
      var(--wui-color-bg-150) 48%,
      var(--wui-color-bg-200) 55%,
      var(--wui-color-bg-200) 60%,
      var(--wui-color-bg-200) calc(60% + 10px),
      var(--wui-color-bg-150) calc(60% + 12px),
      var(--wui-color-bg-150) 100%
    );
    background-size: 250%;
  }

  @keyframes shimmer {
    from {
      background-position: -250% 0;
    }
    to {
      background-position: 250% 0;
    }
  }
`;var Ve=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let ye=class extends O{constructor(){super(...arguments),this.width="",this.height="",this.borderRadius="m",this.variant="default"}render(){return this.style.cssText=`
      width: ${this.width};
      height: ${this.height};
      border-radius: ${`clamp(0px,var(--wui-border-radius-${this.borderRadius}), 40px)`};
    `,c`<slot></slot>`}};ye.styles=[mo];Ve([u()],ye.prototype,"width",void 0);Ve([u()],ye.prototype,"height",void 0);Ve([u()],ye.prototype,"borderRadius",void 0);Ve([u()],ye.prototype,"variant",void 0);ye=Ve([S("wui-shimmer")],ye);const vo=k`
  .reown-logo {
    height: var(--wui-spacing-xxl);
  }
`;var yo=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let Xt=class extends O{render(){return c`
      <wui-flex
        justifyContent="center"
        alignItems="center"
        gap="xs"
        .padding=${["0","0","l","0"]}
      >
        <wui-text variant="small-500" color="fg-100"> UX by </wui-text>
        <wui-icon name="reown" size="xxxl" class="reown-logo"></wui-icon>
      </wui-flex>
    `}};Xt.styles=[q,G,vo];Xt=yo([S("wui-ux-by-reown")],Xt);const xo=k`
  @keyframes fadein {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  wui-shimmer {
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: clamp(0px, var(--wui-border-radius-l), 40px) !important;
  }

  wui-qr-code {
    opacity: 0;
    animation-duration: 200ms;
    animation-timing-function: ease;
    animation-name: fadein;
    animation-fill-mode: forwards;
  }
`;var Co=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let Zt=class extends F{constructor(){super(),this.forceUpdate=()=>{this.requestUpdate()},window.addEventListener("resize",this.forceUpdate),ee.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet?.name??"WalletConnect",platform:"qrcode"}})}disconnectedCallback(){super.disconnectedCallback(),this.unsubscribe?.forEach(e=>e()),window.removeEventListener("resize",this.forceUpdate)}render(){return this.onRenderProxy(),c`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["0","xl","xl","xl"]}
        gap="xl"
      >
        <wui-shimmer borderRadius="l" width="100%"> ${this.qrCodeTemplate()} </wui-shimmer>

        <wui-text variant="paragraph-500" color="fg-100">
          Scan this QR Code with your phone
        </wui-text>
        ${this.copyTemplate()}
      </wui-flex>
      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links>
    `}onRenderProxy(){!this.ready&&this.uri&&(this.timeout=setTimeout(()=>{this.ready=!0},200))}qrCodeTemplate(){if(!this.uri||!this.ready)return null;const e=this.getBoundingClientRect().width-40,n=this.wallet?this.wallet.name:void 0;return D.setWcLinking(void 0),D.setRecentWallet(this.wallet),c` <wui-qr-code
      size=${e}
      theme=${Qt.state.themeMode}
      uri=${this.uri}
      imageSrc=${E(K.getWalletImage(this.wallet))}
      color=${E(Qt.state.themeVariables["--w3m-qr-color"])}
      alt=${E(n)}
      data-testid="wui-qr-code"
    ></wui-qr-code>`}copyTemplate(){const e=!this.uri||!this.ready;return c`<wui-link
      .disabled=${e}
      @click=${this.onCopyUri}
      color="fg-200"
      data-testid="copy-wc2-uri"
    >
      <wui-icon size="xs" color="fg-200" slot="iconLeft" name="copy"></wui-icon>
      Copy link
    </wui-link>`}};Zt.styles=xo;Zt=Co([S("w3m-connecting-wc-qrcode")],Zt);var Ro=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let Zn=class extends O{constructor(){if(super(),this.wallet=U.state.data?.wallet,!this.wallet)throw new Error("w3m-connecting-wc-unsupported: No wallet provided");ee.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"browser"}})}render(){return c`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["3xl","xl","xl","xl"]}
        gap="xl"
      >
        <wui-wallet-image
          size="lg"
          imageSrc=${E(K.getWalletImage(this.wallet))}
        ></wui-wallet-image>

        <wui-text variant="paragraph-500" color="fg-100">Not Detected</wui-text>
      </wui-flex>

      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links>
    `}};Zn=Ro([S("w3m-connecting-wc-unsupported")],Zn);var ui=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let en=class extends F{constructor(){if(super(),this.isLoading=!0,!this.wallet)throw new Error("w3m-connecting-wc-web: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.secondaryBtnLabel="Open",this.secondaryLabel="Open and continue in a new browser tab",this.secondaryBtnIcon="externalLink",this.updateLoadingState(),this.unsubscribe.push(D.subscribeKey("wcUri",()=>{this.updateLoadingState()})),ee.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"web"}})}updateLoadingState(){this.isLoading=!this.uri}onConnectProxy(){if(this.wallet?.webapp_link&&this.uri)try{this.error=!1;const{webapp_link:e,name:n}=this.wallet,{redirect:i,href:o}=A.formatUniversalUrl(e,this.uri);D.setWcLinking({name:n,href:o}),D.setRecentWallet(this.wallet),A.openHref(i,"_blank")}catch{this.error=!0}}};ui([P()],en.prototype,"isLoading",void 0);en=ui([S("w3m-connecting-wc-web")],en);var vt=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let Ue=class extends O{constructor(){super(),this.wallet=U.state.data?.wallet,this.platform=void 0,this.platforms=[],this.isSiwxEnabled=!!me.state.siwx,this.determinePlatforms(),this.initializeConnection()}render(){return c`
      ${this.headerTemplate()}
      <div>${this.platformTemplate()}</div>
      <wui-ux-by-reown></wui-ux-by-reown>
    `}async initializeConnection(e=!1){if(!(this.platform==="browser"||me.state.manualWCControl&&!e))try{const{wcPairingExpiry:n,status:i}=D.state;(e||A.isPairingExpired(n)||i==="connecting")&&(await D.connectWalletConnect(),this.isSiwxEnabled||ni.close())}catch(n){ee.sendEvent({type:"track",event:"CONNECT_ERROR",properties:{message:n?.message??"Unknown"}}),D.setWcError(!0),Qe.showError(n.message??"Connection error"),D.resetWcConnection(),U.goBack()}}determinePlatforms(){if(!this.wallet){this.platforms.push("qrcode"),this.platform="qrcode";return}if(this.platform)return;const{mobile_link:e,desktop_link:n,webapp_link:i,injected:o,rdns:t}=this.wallet,a=o?.map(({injected_id:L})=>L).filter(Boolean),s=[...t?[t]:a??[]],l=me.state.isUniversalProvider?!1:s.length,d=e,p=i,w=D.checkInstalled(s),C=l&&w,g=n&&!A.isMobile();C&&!mn.state.noAdapters&&this.platforms.push("browser"),d&&this.platforms.push(A.isMobile()?"mobile":"qrcode"),p&&this.platforms.push("web"),g&&this.platforms.push("desktop"),!C&&l&&!mn.state.noAdapters&&this.platforms.push("unsupported"),this.platform=this.platforms[0]}platformTemplate(){switch(this.platform){case"browser":return c`<w3m-connecting-wc-browser></w3m-connecting-wc-browser>`;case"web":return c`<w3m-connecting-wc-web></w3m-connecting-wc-web>`;case"desktop":return c`
          <w3m-connecting-wc-desktop .onRetry=${()=>this.initializeConnection(!0)}>
          </w3m-connecting-wc-desktop>
        `;case"mobile":return c`
          <w3m-connecting-wc-mobile isMobile .onRetry=${()=>this.initializeConnection(!0)}>
          </w3m-connecting-wc-mobile>
        `;case"qrcode":return c`<w3m-connecting-wc-qrcode></w3m-connecting-wc-qrcode>`;default:return c`<w3m-connecting-wc-unsupported></w3m-connecting-wc-unsupported>`}}headerTemplate(){return this.platforms.length>1?c`
      <w3m-connecting-header
        .platforms=${this.platforms}
        .onSelectPlatfrom=${this.onSelectPlatform.bind(this)}
      >
      </w3m-connecting-header>
    `:null}async onSelectPlatform(e){const n=this.shadowRoot?.querySelector("div");n&&(await n.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards",easing:"ease"}).finished,this.platform=e,n.animate([{opacity:0},{opacity:1}],{duration:200,fill:"forwards",easing:"ease"}))}};vt([P()],Ue.prototype,"platform",void 0);vt([P()],Ue.prototype,"platforms",void 0);vt([P()],Ue.prototype,"isSiwxEnabled",void 0);Ue=vt([S("w3m-connecting-wc-view")],Ue);var di=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let tn=class extends O{constructor(){super(...arguments),this.isMobile=A.isMobile()}render(){if(this.isMobile){const{featured:e,recommended:n}=M.state,{customWallets:i}=me.state,o=dt.getRecentWallets(),t=e.length||n.length||i?.length||o.length;return c`<wui-flex
        flexDirection="column"
        gap="xs"
        .margin=${["3xs","s","s","s"]}
      >
        ${t?c`<w3m-connector-list></w3m-connector-list>`:null}
        <w3m-all-wallets-widget></w3m-all-wallets-widget>
      </wui-flex>`}return c`<wui-flex flexDirection="column" .padding=${["0","0","l","0"]}>
      <w3m-connecting-wc-view></w3m-connecting-wc-view>
      <wui-flex flexDirection="column" .padding=${["0","m","0","m"]}>
        <w3m-all-wallets-widget></w3m-all-wallets-widget> </wui-flex
    ></wui-flex>`}};di([P()],tn.prototype,"isMobile",void 0);tn=di([S("w3m-connecting-wc-basic-view")],tn);const dn=()=>new $o;class $o{}const Jt=new WeakMap,hn=xi(class extends Ci{render(r){return vn}update(r,[e]){const n=e!==this.G;return n&&this.G!==void 0&&this.rt(void 0),(n||this.lt!==this.ct)&&(this.G=e,this.ht=r.options?.host,this.rt(this.ct=r.element)),vn}rt(r){if(this.isConnected||(r=void 0),typeof this.G=="function"){const e=this.ht??globalThis;let n=Jt.get(e);n===void 0&&(n=new WeakMap,Jt.set(e,n)),n.get(this.G)!==void 0&&this.G.call(this.ht,void 0),n.set(this.G,r),r!==void 0&&this.G.call(this.ht,r)}else this.G.value=r}get lt(){return typeof this.G=="function"?Jt.get(this.ht??globalThis)?.get(this.G):this.G?.value}disconnected(){this.lt===this.ct&&this.rt(void 0)}reconnected(){this.rt(this.ct)}}),Io=k`
  :host {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  label {
    position: relative;
    display: inline-block;
    width: 32px;
    height: 22px;
  }

  input {
    width: 0;
    height: 0;
    opacity: 0;
  }

  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--wui-color-blue-100);
    border-width: 1px;
    border-style: solid;
    border-color: var(--wui-color-gray-glass-002);
    border-radius: 999px;
    transition:
      background-color var(--wui-ease-inout-power-1) var(--wui-duration-md),
      border-color var(--wui-ease-inout-power-1) var(--wui-duration-md);
    will-change: background-color, border-color;
  }

  span:before {
    position: absolute;
    content: '';
    height: 16px;
    width: 16px;
    left: 3px;
    top: 2px;
    background-color: var(--wui-color-inverse-100);
    transition: transform var(--wui-ease-inout-power-1) var(--wui-duration-lg);
    will-change: transform;
    border-radius: 50%;
  }

  input:checked + span {
    border-color: var(--wui-color-gray-glass-005);
    background-color: var(--wui-color-blue-100);
  }

  input:not(:checked) + span {
    background-color: var(--wui-color-gray-glass-010);
  }

  input:checked + span:before {
    transform: translateX(calc(100% - 7px));
  }
`;var hi=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let at=class extends O{constructor(){super(...arguments),this.inputElementRef=dn(),this.checked=void 0}render(){return c`
      <label>
        <input
          ${hn(this.inputElementRef)}
          type="checkbox"
          ?checked=${E(this.checked)}
          @change=${this.dispatchChangeEvent.bind(this)}
        />
        <span></span>
      </label>
    `}dispatchChangeEvent(){this.dispatchEvent(new CustomEvent("switchChange",{detail:this.inputElementRef.value?.checked,bubbles:!0,composed:!0}))}};at.styles=[q,G,yi,Io];hi([u({type:Boolean})],at.prototype,"checked",void 0);at=hi([S("wui-switch")],at);const Eo=k`
  :host {
    height: 100%;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    column-gap: var(--wui-spacing-1xs);
    padding: var(--wui-spacing-xs) var(--wui-spacing-s);
    background-color: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-xs);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-002);
    transition: background-color var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: background-color;
    cursor: pointer;
  }

  wui-switch {
    pointer-events: none;
  }
`;var fi=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let st=class extends O{constructor(){super(...arguments),this.checked=void 0}render(){return c`
      <button>
        <wui-icon size="xl" name="walletConnectBrown"></wui-icon>
        <wui-switch ?checked=${E(this.checked)}></wui-switch>
      </button>
    `}};st.styles=[q,G,Eo];fi([u({type:Boolean})],st.prototype,"checked",void 0);st=fi([S("wui-certified-switch")],st);const Wo=k`
  button {
    background-color: var(--wui-color-fg-300);
    border-radius: var(--wui-border-radius-4xs);
    width: 16px;
    height: 16px;
  }

  button:disabled {
    background-color: var(--wui-color-bg-300);
  }

  wui-icon {
    color: var(--wui-color-bg-200) !important;
  }

  button:focus-visible {
    background-color: var(--wui-color-fg-250);
    border: 1px solid var(--wui-color-accent-100);
  }

  @media (hover: hover) and (pointer: fine) {
    button:hover:enabled {
      background-color: var(--wui-color-fg-250);
    }

    button:active:enabled {
      background-color: var(--wui-color-fg-225);
    }
  }
`;var pi=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let lt=class extends O{constructor(){super(...arguments),this.icon="copy"}render(){return c`
      <button>
        <wui-icon color="inherit" size="xxs" name=${this.icon}></wui-icon>
      </button>
    `}};lt.styles=[q,G,Wo];pi([u()],lt.prototype,"icon",void 0);lt=pi([S("wui-input-element")],lt);const _o=k`
  :host {
    position: relative;
    width: 100%;
    display: inline-block;
    color: var(--wui-color-fg-275);
  }

  input {
    width: 100%;
    border-radius: var(--wui-border-radius-xs);
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-002);
    background: var(--wui-color-gray-glass-002);
    font-size: var(--wui-font-size-paragraph);
    letter-spacing: var(--wui-letter-spacing-paragraph);
    color: var(--wui-color-fg-100);
    transition:
      background-color var(--wui-ease-inout-power-1) var(--wui-duration-md),
      border-color var(--wui-ease-inout-power-1) var(--wui-duration-md),
      box-shadow var(--wui-ease-inout-power-1) var(--wui-duration-md);
    will-change: background-color, border-color, box-shadow;
    caret-color: var(--wui-color-accent-100);
  }

  input:disabled {
    cursor: not-allowed;
    border: 1px solid var(--wui-color-gray-glass-010);
  }

  input:disabled::placeholder,
  input:disabled + wui-icon {
    color: var(--wui-color-fg-300);
  }

  input::placeholder {
    color: var(--wui-color-fg-275);
  }

  input:focus:enabled {
    background-color: var(--wui-color-gray-glass-005);
    -webkit-box-shadow:
      inset 0 0 0 1px var(--wui-color-accent-100),
      0px 0px 0px 4px var(--wui-box-shadow-blue);
    -moz-box-shadow:
      inset 0 0 0 1px var(--wui-color-accent-100),
      0px 0px 0px 4px var(--wui-box-shadow-blue);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-accent-100),
      0px 0px 0px 4px var(--wui-box-shadow-blue);
  }

  input:hover:enabled {
    background-color: var(--wui-color-gray-glass-005);
  }

  wui-icon {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
  }

  .wui-size-sm {
    padding: 9px var(--wui-spacing-m) 10px var(--wui-spacing-s);
  }

  wui-icon + .wui-size-sm {
    padding: 9px var(--wui-spacing-m) 10px 36px;
  }

  wui-icon[data-input='sm'] {
    left: var(--wui-spacing-s);
  }

  .wui-size-md {
    padding: 15px var(--wui-spacing-m) var(--wui-spacing-l) var(--wui-spacing-m);
  }

  wui-icon + .wui-size-md,
  wui-loading-spinner + .wui-size-md {
    padding: 10.5px var(--wui-spacing-3xl) 10.5px var(--wui-spacing-3xl);
  }

  wui-icon[data-input='md'] {
    left: var(--wui-spacing-l);
  }

  .wui-size-lg {
    padding: var(--wui-spacing-s) var(--wui-spacing-s) var(--wui-spacing-s) var(--wui-spacing-l);
    letter-spacing: var(--wui-letter-spacing-medium-title);
    font-size: var(--wui-font-size-medium-title);
    font-weight: var(--wui-font-weight-light);
    line-height: 130%;
    color: var(--wui-color-fg-100);
    height: 64px;
  }

  .wui-padding-right-xs {
    padding-right: var(--wui-spacing-xs);
  }

  .wui-padding-right-s {
    padding-right: var(--wui-spacing-s);
  }

  .wui-padding-right-m {
    padding-right: var(--wui-spacing-m);
  }

  .wui-padding-right-l {
    padding-right: var(--wui-spacing-l);
  }

  .wui-padding-right-xl {
    padding-right: var(--wui-spacing-xl);
  }

  .wui-padding-right-2xl {
    padding-right: var(--wui-spacing-2xl);
  }

  .wui-padding-right-3xl {
    padding-right: var(--wui-spacing-3xl);
  }

  .wui-padding-right-4xl {
    padding-right: var(--wui-spacing-4xl);
  }

  .wui-padding-right-5xl {
    padding-right: var(--wui-spacing-5xl);
  }

  wui-icon + .wui-size-lg,
  wui-loading-spinner + .wui-size-lg {
    padding-left: 50px;
  }

  wui-icon[data-input='lg'] {
    left: var(--wui-spacing-l);
  }

  .wui-size-mdl {
    padding: 17.25px var(--wui-spacing-m) 17.25px var(--wui-spacing-m);
  }
  wui-icon + .wui-size-mdl,
  wui-loading-spinner + .wui-size-mdl {
    padding: 17.25px var(--wui-spacing-3xl) 17.25px 40px;
  }
  wui-icon[data-input='mdl'] {
    left: var(--wui-spacing-m);
  }

  input:placeholder-shown ~ ::slotted(wui-input-element),
  input:placeholder-shown ~ ::slotted(wui-icon) {
    opacity: 0;
    pointer-events: none;
  }

  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type='number'] {
    -moz-appearance: textfield;
  }

  ::slotted(wui-input-element),
  ::slotted(wui-icon) {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
  }

  ::slotted(wui-input-element) {
    right: var(--wui-spacing-m);
  }

  ::slotted(wui-icon) {
    right: 0px;
  }
`;var se=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let X=class extends O{constructor(){super(...arguments),this.inputElementRef=dn(),this.size="md",this.disabled=!1,this.placeholder="",this.type="text",this.value=""}render(){const e=`wui-padding-right-${this.inputRightPadding}`,i={[`wui-size-${this.size}`]:!0,[e]:!!this.inputRightPadding};return c`${this.templateIcon()}
      <input
        data-testid="wui-input-text"
        ${hn(this.inputElementRef)}
        class=${Ri(i)}
        type=${this.type}
        enterkeyhint=${E(this.enterKeyHint)}
        ?disabled=${this.disabled}
        placeholder=${this.placeholder}
        @input=${this.dispatchInputChangeEvent.bind(this)}
        .value=${this.value||""}
        tabindex=${E(this.tabIdx)}
      />
      <slot></slot>`}templateIcon(){return this.icon?c`<wui-icon
        data-input=${this.size}
        size=${this.size}
        color="inherit"
        name=${this.icon}
      ></wui-icon>`:null}dispatchInputChangeEvent(){this.dispatchEvent(new CustomEvent("inputChange",{detail:this.inputElementRef.value?.value,bubbles:!0,composed:!0}))}};X.styles=[q,G,_o];se([u()],X.prototype,"size",void 0);se([u()],X.prototype,"icon",void 0);se([u({type:Boolean})],X.prototype,"disabled",void 0);se([u()],X.prototype,"placeholder",void 0);se([u()],X.prototype,"type",void 0);se([u()],X.prototype,"keyHint",void 0);se([u()],X.prototype,"value",void 0);se([u()],X.prototype,"inputRightPadding",void 0);se([u()],X.prototype,"tabIdx",void 0);X=se([S("wui-input-text")],X);const So=k`
  :host {
    position: relative;
    display: inline-block;
    width: 100%;
  }
`;var To=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let nn=class extends O{constructor(){super(...arguments),this.inputComponentRef=dn()}render(){return c`
      <wui-input-text
        ${hn(this.inputComponentRef)}
        placeholder="Search wallet"
        icon="search"
        type="search"
        enterKeyHint="search"
        size="sm"
      >
        <wui-input-element @click=${this.clearValue} icon="close"></wui-input-element>
      </wui-input-text>
    `}clearValue(){const n=this.inputComponentRef.value?.inputElementRef.value;n&&(n.value="",n.focus(),n.dispatchEvent(new Event("input")))}};nn.styles=[q,So];nn=To([S("wui-search-bar")],nn);const Bo=je`<svg  viewBox="0 0 48 54" fill="none">
  <path
    d="M43.4605 10.7248L28.0485 1.61089C25.5438 0.129705 22.4562 0.129705 19.9515 1.61088L4.53951 10.7248C2.03626 12.2051 0.5 14.9365 0.5 17.886V36.1139C0.5 39.0635 2.03626 41.7949 4.53951 43.2752L19.9515 52.3891C22.4562 53.8703 25.5438 53.8703 28.0485 52.3891L43.4605 43.2752C45.9637 41.7949 47.5 39.0635 47.5 36.114V17.8861C47.5 14.9365 45.9637 12.2051 43.4605 10.7248Z"
  />
</svg>`,Po=k`
  :host {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 104px;
    row-gap: var(--wui-spacing-xs);
    padding: var(--wui-spacing-xs) 10px;
    background-color: var(--wui-color-gray-glass-002);
    border-radius: clamp(0px, var(--wui-border-radius-xs), 20px);
    position: relative;
  }

  wui-shimmer[data-type='network'] {
    border: none;
    -webkit-clip-path: var(--wui-path-network);
    clip-path: var(--wui-path-network);
  }

  svg {
    position: absolute;
    width: 48px;
    height: 54px;
    z-index: 1;
  }

  svg > path {
    stroke: var(--wui-color-gray-glass-010);
    stroke-width: 1px;
  }

  @media (max-width: 350px) {
    :host {
      width: 100%;
    }
  }
`;var gi=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let ct=class extends O{constructor(){super(...arguments),this.type="wallet"}render(){return c`
      ${this.shimmerTemplate()}
      <wui-shimmer width="56px" height="20px" borderRadius="xs"></wui-shimmer>
    `}shimmerTemplate(){return this.type==="network"?c` <wui-shimmer
          data-type=${this.type}
          width="48px"
          height="54px"
          borderRadius="xs"
        ></wui-shimmer>
        ${Bo}`:c`<wui-shimmer width="56px" height="56px" borderRadius="xs"></wui-shimmer>`}};ct.styles=[q,G,Po];gi([u()],ct.prototype,"type",void 0);ct=gi([S("wui-card-select-loader")],ct);const Lo=k`
  :host {
    display: grid;
    width: inherit;
    height: inherit;
  }
`;var Z=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let H=class extends O{render(){return this.style.cssText=`
      grid-template-rows: ${this.gridTemplateRows};
      grid-template-columns: ${this.gridTemplateColumns};
      justify-items: ${this.justifyItems};
      align-items: ${this.alignItems};
      justify-content: ${this.justifyContent};
      align-content: ${this.alignContent};
      column-gap: ${this.columnGap&&`var(--wui-spacing-${this.columnGap})`};
      row-gap: ${this.rowGap&&`var(--wui-spacing-${this.rowGap})`};
      gap: ${this.gap&&`var(--wui-spacing-${this.gap})`};
      padding-top: ${this.padding&&de.getSpacingStyles(this.padding,0)};
      padding-right: ${this.padding&&de.getSpacingStyles(this.padding,1)};
      padding-bottom: ${this.padding&&de.getSpacingStyles(this.padding,2)};
      padding-left: ${this.padding&&de.getSpacingStyles(this.padding,3)};
      margin-top: ${this.margin&&de.getSpacingStyles(this.margin,0)};
      margin-right: ${this.margin&&de.getSpacingStyles(this.margin,1)};
      margin-bottom: ${this.margin&&de.getSpacingStyles(this.margin,2)};
      margin-left: ${this.margin&&de.getSpacingStyles(this.margin,3)};
    `,c`<slot></slot>`}};H.styles=[q,Lo];Z([u()],H.prototype,"gridTemplateRows",void 0);Z([u()],H.prototype,"gridTemplateColumns",void 0);Z([u()],H.prototype,"justifyItems",void 0);Z([u()],H.prototype,"alignItems",void 0);Z([u()],H.prototype,"justifyContent",void 0);Z([u()],H.prototype,"alignContent",void 0);Z([u()],H.prototype,"columnGap",void 0);Z([u()],H.prototype,"rowGap",void 0);Z([u()],H.prototype,"gap",void 0);Z([u()],H.prototype,"padding",void 0);Z([u()],H.prototype,"margin",void 0);H=Z([S("wui-grid")],H);const Oo=k`
  button {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    width: 104px;
    row-gap: var(--wui-spacing-xs);
    padding: var(--wui-spacing-s) var(--wui-spacing-0);
    background-color: var(--wui-color-gray-glass-002);
    border-radius: clamp(0px, var(--wui-border-radius-xs), 20px);
    transition:
      color var(--wui-duration-lg) var(--wui-ease-out-power-1),
      background-color var(--wui-duration-lg) var(--wui-ease-out-power-1),
      border-radius var(--wui-duration-lg) var(--wui-ease-out-power-1);
    will-change: background-color, color, border-radius;
    outline: none;
    border: none;
  }

  button > wui-flex > wui-text {
    color: var(--wui-color-fg-100);
    max-width: 86px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    justify-content: center;
  }

  button > wui-flex > wui-text.certified {
    max-width: 66px;
  }

  button:hover:enabled {
    background-color: var(--wui-color-gray-glass-005);
  }

  button:disabled > wui-flex > wui-text {
    color: var(--wui-color-gray-glass-015);
  }

  [data-selected='true'] {
    background-color: var(--wui-color-accent-glass-020);
  }

  @media (hover: hover) and (pointer: fine) {
    [data-selected='true']:hover:enabled {
      background-color: var(--wui-color-accent-glass-015);
    }
  }

  [data-selected='true']:active:enabled {
    background-color: var(--wui-color-accent-glass-010);
  }

  @media (max-width: 350px) {
    button {
      width: 100%;
    }
  }
`;var Ke=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let xe=class extends O{constructor(){super(),this.observer=new IntersectionObserver(()=>{}),this.visible=!1,this.imageSrc=void 0,this.imageLoading=!1,this.wallet=void 0,this.observer=new IntersectionObserver(e=>{e.forEach(n=>{n.isIntersecting?(this.visible=!0,this.fetchImageSrc()):this.visible=!1})},{threshold:.01})}firstUpdated(){this.observer.observe(this)}disconnectedCallback(){this.observer.disconnect()}render(){const e=this.wallet?.badge_type==="certified";return c`
      <button>
        ${this.imageTemplate()}
        <wui-flex flexDirection="row" alignItems="center" justifyContent="center" gap="3xs">
          <wui-text
            variant="tiny-500"
            color="inherit"
            class=${E(e?"certified":void 0)}
            >${this.wallet?.name}</wui-text
          >
          ${e?c`<wui-icon size="sm" name="walletConnectBrown"></wui-icon>`:null}
        </wui-flex>
      </button>
    `}imageTemplate(){return!this.visible&&!this.imageSrc||this.imageLoading?this.shimmerTemplate():c`
      <wui-wallet-image
        size="md"
        imageSrc=${E(this.imageSrc)}
        name=${this.wallet?.name}
        .installed=${this.wallet?.installed}
        badgeSize="sm"
      >
      </wui-wallet-image>
    `}shimmerTemplate(){return c`<wui-shimmer width="56px" height="56px" borderRadius="xs"></wui-shimmer>`}async fetchImageSrc(){this.wallet&&(this.imageSrc=K.getWalletImage(this.wallet),!this.imageSrc&&(this.imageLoading=!0,this.imageSrc=await K.fetchWalletImage(this.wallet.image_id),this.imageLoading=!1))}};xe.styles=Oo;Ke([P()],xe.prototype,"visible",void 0);Ke([P()],xe.prototype,"imageSrc",void 0);Ke([P()],xe.prototype,"imageLoading",void 0);Ke([u()],xe.prototype,"wallet",void 0);xe=Ke([S("w3m-all-wallets-list-item")],xe);const Ao=k`
  wui-grid {
    max-height: clamp(360px, 400px, 80vh);
    overflow: scroll;
    scrollbar-width: none;
    grid-auto-rows: min-content;
    grid-template-columns: repeat(auto-fill, 104px);
  }

  @media (max-width: 350px) {
    wui-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  wui-grid[data-scroll='false'] {
    overflow: hidden;
  }

  wui-grid::-webkit-scrollbar {
    display: none;
  }

  wui-loading-spinner {
    padding-top: var(--wui-spacing-l);
    padding-bottom: var(--wui-spacing-l);
    justify-content: center;
    grid-column: 1 / span 4;
  }
`;var He=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};const ei="local-paginator";let Ce=class extends O{constructor(){super(),this.unsubscribe=[],this.paginationObserver=void 0,this.loading=!M.state.wallets.length,this.wallets=M.state.wallets,this.recommended=M.state.recommended,this.featured=M.state.featured,this.unsubscribe.push(M.subscribeKey("wallets",e=>this.wallets=e),M.subscribeKey("recommended",e=>this.recommended=e),M.subscribeKey("featured",e=>this.featured=e))}firstUpdated(){this.initialFetch(),this.createPaginationObserver()}disconnectedCallback(){this.unsubscribe.forEach(e=>e()),this.paginationObserver?.disconnect()}render(){return c`
      <wui-grid
        data-scroll=${!this.loading}
        .padding=${["0","s","s","s"]}
        columnGap="xxs"
        rowGap="l"
        justifyContent="space-between"
      >
        ${this.loading?this.shimmerTemplate(16):this.walletsTemplate()}
        ${this.paginationLoaderTemplate()}
      </wui-grid>
    `}async initialFetch(){this.loading=!0;const e=this.shadowRoot?.querySelector("wui-grid");e&&(await M.fetchWallets({page:1}),await e.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards",easing:"ease"}).finished,this.loading=!1,e.animate([{opacity:0},{opacity:1}],{duration:200,fill:"forwards",easing:"ease"}))}shimmerTemplate(e,n){return[...Array(e)].map(()=>c`
        <wui-card-select-loader type="wallet" id=${E(n)}></wui-card-select-loader>
      `)}walletsTemplate(){const e=A.uniqueBy([...this.featured,...this.recommended,...this.wallets],"id");return on.markWalletsAsInstalled(e).map(i=>c`
        <w3m-all-wallets-list-item
          @click=${()=>this.onConnectWallet(i)}
          .wallet=${i}
        ></w3m-all-wallets-list-item>
      `)}paginationLoaderTemplate(){const{wallets:e,recommended:n,featured:i,count:o}=M.state,t=window.innerWidth<352?3:4,a=e.length+n.length;let l=Math.ceil(a/t)*t-a+t;return l-=e.length?i.length%t:0,o===0&&i.length>0?null:o===0||[...i,...e,...n].length<o?this.shimmerTemplate(l,ei):null}createPaginationObserver(){const e=this.shadowRoot?.querySelector(`#${ei}`);e&&(this.paginationObserver=new IntersectionObserver(([n])=>{if(n?.isIntersecting&&!this.loading){const{page:i,count:o,wallets:t}=M.state;t.length<o&&M.fetchWallets({page:i+1})}}),this.paginationObserver.observe(e))}onConnectWallet(e){N.selectWalletConnector(e)}};Ce.styles=Ao;He([P()],Ce.prototype,"loading",void 0);He([P()],Ce.prototype,"wallets",void 0);He([P()],Ce.prototype,"recommended",void 0);He([P()],Ce.prototype,"featured",void 0);Ce=He([S("w3m-all-wallets-list")],Ce);const jo=k`
  wui-grid,
  wui-loading-spinner,
  wui-flex {
    height: 360px;
  }

  wui-grid {
    overflow: scroll;
    scrollbar-width: none;
    grid-auto-rows: min-content;
    grid-template-columns: repeat(auto-fill, 104px);
  }

  wui-grid[data-scroll='false'] {
    overflow: hidden;
  }

  wui-grid::-webkit-scrollbar {
    display: none;
  }

  wui-loading-spinner {
    justify-content: center;
    align-items: center;
  }

  @media (max-width: 350px) {
    wui-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
`;var yt=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let Pe=class extends O{constructor(){super(...arguments),this.prevQuery="",this.prevBadge=void 0,this.loading=!0,this.query=""}render(){return this.onSearch(),this.loading?c`<wui-loading-spinner color="accent-100"></wui-loading-spinner>`:this.walletsTemplate()}async onSearch(){(this.query.trim()!==this.prevQuery.trim()||this.badge!==this.prevBadge)&&(this.prevQuery=this.query,this.prevBadge=this.badge,this.loading=!0,await M.searchWallet({search:this.query,badge:this.badge}),this.loading=!1)}walletsTemplate(){const{search:e}=M.state,n=on.markWalletsAsInstalled(e);return e.length?c`
      <wui-grid
        data-testid="wallet-list"
        .padding=${["0","s","s","s"]}
        rowGap="l"
        columnGap="xs"
        justifyContent="space-between"
      >
        ${n.map(i=>c`
            <w3m-all-wallets-list-item
              @click=${()=>this.onConnectWallet(i)}
              .wallet=${i}
              data-testid="wallet-search-item-${i.id}"
            ></w3m-all-wallets-list-item>
          `)}
      </wui-grid>
    `:c`
        <wui-flex
          data-testid="no-wallet-found"
          justifyContent="center"
          alignItems="center"
          gap="s"
          flexDirection="column"
        >
          <wui-icon-box
            size="lg"
            iconColor="fg-200"
            backgroundColor="fg-300"
            icon="wallet"
            background="transparent"
          ></wui-icon-box>
          <wui-text data-testid="no-wallet-found-text" color="fg-200" variant="paragraph-500">
            No Wallet found
          </wui-text>
        </wui-flex>
      `}onConnectWallet(e){N.selectWalletConnector(e)}};Pe.styles=jo;yt([P()],Pe.prototype,"loading",void 0);yt([u()],Pe.prototype,"query",void 0);yt([u()],Pe.prototype,"badge",void 0);Pe=yt([S("w3m-all-wallets-search")],Pe);var fn=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let ut=class extends O{constructor(){super(...arguments),this.search="",this.onDebouncedSearch=A.debounce(e=>{this.search=e})}render(){const e=this.search.length>=2;return c`
      <wui-flex .padding=${["0","s","s","s"]} gap="xs">
        <wui-search-bar @inputChange=${this.onInputChange.bind(this)}></wui-search-bar>
        <wui-certified-switch
          ?checked=${this.badge}
          @click=${this.onClick.bind(this)}
          data-testid="wui-certified-switch"
        ></wui-certified-switch>
        ${this.qrButtonTemplate()}
      </wui-flex>
      ${e||this.badge?c`<w3m-all-wallets-search
            query=${this.search}
            badge=${E(this.badge)}
          ></w3m-all-wallets-search>`:c`<w3m-all-wallets-list badge=${E(this.badge)}></w3m-all-wallets-list>`}
    `}onInputChange(e){this.onDebouncedSearch(e.detail)}onClick(){if(this.badge==="certified"){this.badge=void 0;return}this.badge="certified",Qe.showSvg("Only WalletConnect certified",{icon:"walletConnectBrown",iconColor:"accent-100"})}qrButtonTemplate(){return A.isMobile()?c`
        <wui-icon-box
          size="lg"
          iconSize="xl"
          iconColor="accent-100"
          backgroundColor="accent-100"
          icon="qrCode"
          background="transparent"
          border
          borderColor="wui-accent-glass-010"
          @click=${this.onWalletConnectQr.bind(this)}
        ></wui-icon-box>
      `:null}onWalletConnectQr(){U.push("ConnectingWalletConnect")}};fn([P()],ut.prototype,"search",void 0);fn([P()],ut.prototype,"badge",void 0);ut=fn([S("w3m-all-wallets-view")],ut);const Do=k`
  button {
    column-gap: var(--wui-spacing-s);
    padding: 11px 18px 11px var(--wui-spacing-s);
    width: 100%;
    background-color: var(--wui-color-gray-glass-002);
    border-radius: var(--wui-border-radius-xs);
    color: var(--wui-color-fg-250);
    transition:
      color var(--wui-ease-out-power-1) var(--wui-duration-md),
      background-color var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: color, background-color;
  }

  button[data-iconvariant='square'],
  button[data-iconvariant='square-blue'] {
    padding: 6px 18px 6px 9px;
  }

  button > wui-flex {
    flex: 1;
  }

  button > wui-image {
    width: 32px;
    height: 32px;
    box-shadow: 0 0 0 2px var(--wui-color-gray-glass-005);
    border-radius: var(--wui-border-radius-3xl);
  }

  button > wui-icon {
    width: 36px;
    height: 36px;
    transition: opacity var(--wui-ease-out-power-1) var(--wui-duration-md);
    will-change: opacity;
  }

  button > wui-icon-box[data-variant='blue'] {
    box-shadow: 0 0 0 2px var(--wui-color-accent-glass-005);
  }

  button > wui-icon-box[data-variant='overlay'] {
    box-shadow: 0 0 0 2px var(--wui-color-gray-glass-005);
  }

  button > wui-icon-box[data-variant='square-blue'] {
    border-radius: var(--wui-border-radius-3xs);
    position: relative;
    border: none;
    width: 36px;
    height: 36px;
  }

  button > wui-icon-box[data-variant='square-blue']::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: inherit;
    border: 1px solid var(--wui-color-accent-glass-010);
    pointer-events: none;
  }

  button > wui-icon:last-child {
    width: 14px;
    height: 14px;
  }

  button:disabled {
    color: var(--wui-color-gray-glass-020);
  }

  button[data-loading='true'] > wui-icon {
    opacity: 0;
  }

  wui-loading-spinner {
    position: absolute;
    right: 18px;
    top: 50%;
    transform: translateY(-50%);
  }
`;var ie=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let J=class extends O{constructor(){super(...arguments),this.tabIdx=void 0,this.variant="icon",this.disabled=!1,this.imageSrc=void 0,this.alt=void 0,this.chevron=!1,this.loading=!1}render(){return c`
      <button
        ?disabled=${this.loading?!0:!!this.disabled}
        data-loading=${this.loading}
        data-iconvariant=${E(this.iconVariant)}
        tabindex=${E(this.tabIdx)}
      >
        ${this.loadingTemplate()} ${this.visualTemplate()}
        <wui-flex gap="3xs">
          <slot></slot>
        </wui-flex>
        ${this.chevronTemplate()}
      </button>
    `}visualTemplate(){if(this.variant==="image"&&this.imageSrc)return c`<wui-image src=${this.imageSrc} alt=${this.alt??"list item"}></wui-image>`;if(this.iconVariant==="square"&&this.icon&&this.variant==="icon")return c`<wui-icon name=${this.icon}></wui-icon>`;if(this.variant==="icon"&&this.icon&&this.iconVariant){const e=["blue","square-blue"].includes(this.iconVariant)?"accent-100":"fg-200",n=this.iconVariant==="square-blue"?"mdl":"md",i=this.iconSize?this.iconSize:n;return c`
        <wui-icon-box
          data-variant=${this.iconVariant}
          icon=${this.icon}
          iconSize=${i}
          background="transparent"
          iconColor=${e}
          backgroundColor=${e}
          size=${n}
        ></wui-icon-box>
      `}return null}loadingTemplate(){return this.loading?c`<wui-loading-spinner
        data-testid="wui-list-item-loading-spinner"
        color="fg-300"
      ></wui-loading-spinner>`:c``}chevronTemplate(){return this.chevron?c`<wui-icon size="inherit" color="fg-200" name="chevronRight"></wui-icon>`:null}};J.styles=[q,G,Do];ie([u()],J.prototype,"icon",void 0);ie([u()],J.prototype,"iconSize",void 0);ie([u()],J.prototype,"tabIdx",void 0);ie([u()],J.prototype,"variant",void 0);ie([u()],J.prototype,"iconVariant",void 0);ie([u({type:Boolean})],J.prototype,"disabled",void 0);ie([u()],J.prototype,"imageSrc",void 0);ie([u()],J.prototype,"alt",void 0);ie([u({type:Boolean})],J.prototype,"chevron",void 0);ie([u({type:Boolean})],J.prototype,"loading",void 0);J=ie([S("wui-list-item")],J);var zo=function(r,e,n,i){var o=arguments.length,t=o<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,n):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")t=Reflect.decorate(r,e,n,i);else for(var s=r.length-1;s>=0;s--)(a=r[s])&&(t=(o<3?a(t):o>3?a(e,n,t):a(e,n))||t);return o>3&&t&&Object.defineProperty(e,n,t),t};let ti=class extends O{constructor(){super(...arguments),this.wallet=U.state.data?.wallet}render(){if(!this.wallet)throw new Error("w3m-downloads-view");return c`
      <wui-flex gap="xs" flexDirection="column" .padding=${["s","s","l","s"]}>
        ${this.chromeTemplate()} ${this.iosTemplate()} ${this.androidTemplate()}
        ${this.homepageTemplate()}
      </wui-flex>
    `}chromeTemplate(){return this.wallet?.chrome_store?c`<wui-list-item
      variant="icon"
      icon="chromeStore"
      iconVariant="square"
      @click=${this.onChromeStore.bind(this)}
      chevron
    >
      <wui-text variant="paragraph-500" color="fg-100">Chrome Extension</wui-text>
    </wui-list-item>`:null}iosTemplate(){return this.wallet?.app_store?c`<wui-list-item
      variant="icon"
      icon="appStore"
      iconVariant="square"
      @click=${this.onAppStore.bind(this)}
      chevron
    >
      <wui-text variant="paragraph-500" color="fg-100">iOS App</wui-text>
    </wui-list-item>`:null}androidTemplate(){return this.wallet?.play_store?c`<wui-list-item
      variant="icon"
      icon="playStore"
      iconVariant="square"
      @click=${this.onPlayStore.bind(this)}
      chevron
    >
      <wui-text variant="paragraph-500" color="fg-100">Android App</wui-text>
    </wui-list-item>`:null}homepageTemplate(){return this.wallet?.homepage?c`
      <wui-list-item
        variant="icon"
        icon="browser"
        iconVariant="square-blue"
        @click=${this.onHomePage.bind(this)}
        chevron
      >
        <wui-text variant="paragraph-500" color="fg-100">Website</wui-text>
      </wui-list-item>
    `:null}onChromeStore(){this.wallet?.chrome_store&&A.openHref(this.wallet.chrome_store,"_blank")}onAppStore(){this.wallet?.app_store&&A.openHref(this.wallet.app_store,"_blank")}onPlayStore(){this.wallet?.play_store&&A.openHref(this.wallet.play_store,"_blank")}onHomePage(){this.wallet?.homepage&&A.openHref(this.wallet.homepage,"_blank")}};ti=zo([S("w3m-downloads-view")],ti);export{ut as W3mAllWalletsView,tn as W3mConnectingWcBasicView,ti as W3mDownloadsView};
