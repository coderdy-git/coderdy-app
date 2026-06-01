const fs = require('fs');
let appJs = fs.readFileSync('src/js/app.js', 'utf8');

const insertPoint = `  const profilePanel = document.getElementById('profile-panel');`;
const companyVars = `
  const companyPanel = document.getElementById('company-panel');
  const detailCompanyBtn = document.getElementById('detail-company-btn');
  const backFromCompanyBtn = document.getElementById('back-from-company');
`;
if (!appJs.includes('companyPanel')) {
  appJs = appJs.replace(insertPoint, insertPoint + companyVars);
}

const insertLogicPoint = `  backToDashBtn.addEventListener('click', () => {`;
const companyLogic = `
  detailCompanyBtn?.addEventListener('click', async () => {
    profilePanel.style.opacity = '0';
    
    // Fetch profile details for company info
    const { data: prof, error } = await supabase.from('profiles').select('*').eq('id', currentSessionUser.id).single();
    if (prof && !error) {
      document.getElementById('company-detail-name').textContent = prof.company || '-';
      document.getElementById('company-detail-dept').textContent = prof.department || '-';
      document.getElementById('company-detail-title').textContent = prof.job_title || '-';
    }
    
    setTimeout(() => {
      profilePanel.classList.add('hidden');
      companyPanel.classList.remove('hidden');
      setTimeout(() => { companyPanel.style.opacity = '1'; }, 50);
    }, 300);
  });

  backFromCompanyBtn?.addEventListener('click', () => {
    companyPanel.style.opacity = '0';
    setTimeout(() => {
      companyPanel.classList.add('hidden');
      profilePanel.classList.remove('hidden');
      setTimeout(() => { profilePanel.style.opacity = '1'; }, 50);
    }, 300);
  });

`;
if (!appJs.includes('backFromCompanyBtn?.addEventListener')) {
  appJs = appJs.replace(insertLogicPoint, companyLogic + insertLogicPoint);
}

const roleLogicPoint = `            devClearBtn?.classList.remove('hidden');\n            devDummyBtn?.classList.remove('hidden');\n          }`;
const detailBtnShowLogic = `
          
          if (userRole === 'Employee') {
            if (detailCompanyBtn) detailCompanyBtn.classList.remove('hidden');
          } else {
            if (detailCompanyBtn) detailCompanyBtn.classList.add('hidden');
          }
`;
if (!appJs.includes('userRole === \'Employee\'')) {
  appJs = appJs.replace(roleLogicPoint, roleLogicPoint + detailBtnShowLogic);
}

fs.writeFileSync('src/js/app.js', appJs);
