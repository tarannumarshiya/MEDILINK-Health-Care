import os
import re

login_pages = [
    r'c:\Users\Arshiya tarrnum\OneDrive\Desktop\M\medlink\src\app\admin\login\page.tsx',
    r'c:\Users\Arshiya tarrnum\OneDrive\Desktop\M\medlink\src\app\billing\login\page.tsx',
    r'c:\Users\Arshiya tarrnum\OneDrive\Desktop\M\medlink\src\app\doctor\login\page.tsx',
    r'c:\Users\Arshiya tarrnum\OneDrive\Desktop\M\medlink\src\app\emergency\login\page.tsx',
    r'c:\Users\Arshiya tarrnum\OneDrive\Desktop\M\medlink\src\app\insurance\login\page.tsx',
    r'c:\Users\Arshiya tarrnum\OneDrive\Desktop\M\medlink\src\app\lab\login\page.tsx',
    r'c:\Users\Arshiya tarrnum\OneDrive\Desktop\M\medlink\src\app\pharmacy\login\page.tsx',
    r'c:\Users\Arshiya tarrnum\OneDrive\Desktop\M\medlink\src\app\reception\login\page.tsx',
    r'c:\Users\Arshiya tarrnum\OneDrive\Desktop\M\medlink\src\app\super-admin\login\page.tsx',
    r'c:\Users\Arshiya tarrnum\OneDrive\Desktop\M\medlink\src\app\telemedicine\login\page.tsx',
]

for page in login_pages:
    if not os.path.exists(page):
        print(f"File not found: {page}")
        continue
    with open(page, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'BrandLogo' in content:
        print(f"Skipping {page}, already has BrandLogo")
        continue

    # Insert import after the first import
    import_idx = content.find('import ')
    if import_idx != -1:
        end_idx = content.find('\n', import_idx)
        content = content[:end_idx] + '\nimport BrandLogo from "@/components/BrandLogo";' + content[end_idx:]

    # Find the icon inside the gradient div
    # It looks like:
    # <div className="flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-... to-... p-8 text-center text-white">
    #   <IconName className="h-10 w-10" />
    
    bg_match = re.search(r'(bg-gradient-to-br[^>]*>\s*)<([A-Za-z0-9]+)\s+className="h-10 w-10"\s*/>', content)
    if bg_match:
        icon_tag = bg_match.group(2)
        print(f"Found icon {icon_tag} in {page}")
        content = content.replace(f'<{icon_tag} className="h-10 w-10" />', '<BrandLogo isLink={false} className="mb-2 scale-110" />')
    else:
        print(f"Could not find icon to replace in {page}")
        
    with open(page, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {page}")

# Now also check staff login: src/app/login/page.tsx
staff_login = r'c:\Users\Arshiya tarrnum\OneDrive\Desktop\M\medlink\src\app\login\page.tsx'
if os.path.exists(staff_login):
    with open(staff_login, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'BrandLogo' not in content:
        import_idx = content.find('import ')
        if import_idx != -1:
            end_idx = content.find('\n', import_idx)
            content = content[:end_idx] + '\nimport BrandLogo from "@/components/BrandLogo";' + content[end_idx:]
            
        # Desktop Logo block replacement
        # Find:
        # {/* Logo */}
        # <div className="relative flex items-center gap-3">
        #   <div className="flex h-10 w-10 items-center justify-center rounded-2xl text-white font-black"
        #     style={{ background:"var(--grad-primary)", boxShadow:"0 6px 20px rgba(27,95,168,.50)" }}>
        #     <svg ... </svg>
        #   </div>
        #   <div>
        #     <p className="text-lg font-black text-white tracking-widest uppercase">Medilink</p>
        #     <p className="text-[9px] font-bold uppercase tracking-[.22em] text-white/40">Health Care</p>
        #   </div>
        # </div>
        # I will replace this whole chunk with <BrandLogo className="scale-125 origin-left" /> (or just <BrandLogo isLink={false} /> maybe?)
        # Let's just use re.sub for desktop and mobile logos
        desktop_logo_pattern = r'\{\/\*\s*Logo\s*\*\/\}\s*<div className="relative flex items-center gap-3">.*?</div>\s*</div>\s*</div>'
        # Actually it's easier to just match from {/* Logo */} down to the closing div of that block.
        desktop_match = re.search(r'(\{\/\*\s*Logo\s*\*\/\}\s*)<div className="relative flex items-center gap-3">.*?(?:<p[^>]*>.*?</p>\s*</div>\s*</div>)', content, re.DOTALL)
        if desktop_match:
            content = content.replace(desktop_match.group(0), desktop_match.group(1) + '<BrandLogo isLink={false} className="scale-125 origin-left" />')
            print("Replaced desktop logo in staff login")
            
        # Mobile Logo
        mobile_match = re.search(r'(\{\/\*\s*Mobile logo\s*\*\/\}\s*)<div className="mb-8 flex items-center gap-3 lg:hidden">.*?(?:<p[^>]*>.*?</p>\s*</div>\s*</div>)', content, re.DOTALL)
        if mobile_match:
            content = content.replace(mobile_match.group(0), mobile_match.group(1) + '<BrandLogo isLink={false} className="mb-8 lg:hidden" />')
            print("Replaced mobile logo in staff login")

        with open(staff_login, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {staff_login}")
