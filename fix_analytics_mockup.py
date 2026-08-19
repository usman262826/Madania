import re

with open('src/components/dashboard/Analytics.tsx', 'r') as f:
    content = f.read()

# find and remove the block
content = re.sub(r'\{\s*id: "app-mockup",\s*title: "মোবাইল অ্যাপ",\s*desc: "অভিভাবকদের জন্য",\s*icon: Smartphone,\s*component: MobileBrandedAppMockup,\s*\},', '', content)

with open('src/components/dashboard/Analytics.tsx', 'w') as f:
    f.write(content)
