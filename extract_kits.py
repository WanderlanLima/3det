from pathlib import Path
import pdfplumber
import re
import json

pdf_path = Path('Livros/3DeT-Victory-Manual-Do-Arcanauta.pdf')
output_path = Path('kits.json')

# Step 1: remove existing kits.json at repo root
if output_path.exists():
    output_path.unlink()

kits = []
current = None
current_power_lines = []
start_capture = False
header_buffer = []
title_re = re.compile(r'^[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-Za-zÁÉÍÓÚÂÊÎÔÛÃÕÇà-ü ]*(?: [A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-Za-zÁÉÍÓÚÂÊÎÔÛÃÕÇà-ü ]*)*$')

with pdfplumber.open(pdf_path) as pdf:
    for page_index, page in enumerate(pdf.pages):
        text = page.extract_text() or ''
        lines = [ln.strip() for ln in text.splitlines()]
        # Start capturing after header "Kits de Personagem"
        if not start_capture:
            header_buffer.extend(lines)
            header_join = ' '.join(header_buffer)
            if 'Kits de Personagem' in header_join:
                start_capture = True
            continue
        for i, line in enumerate(lines):
            if not line:
                continue
            if re.fullmatch(r'\d+', line) or re.fullmatch(r'[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ]{2,}', line):
                continue
            if line.startswith('Núcleos.'):
                if current:
                    if current_power_lines:
                        power_text = ' '.join(current_power_lines).strip()
                        m = re.match(r'([^\.]+)\.\s*(.*)', power_text)
                        if m:
                            name, desc = m.groups()
                        else:
                            parts = power_text.split(' ', 1)
                            name = parts[0]
                            desc = parts[1] if len(parts) > 1 else ''
                        current['poderes'].append({'nome': name, 'descricao': desc})
                        current_power_lines = []
                    kits.append(current)
                kit_name = None
                for back in range(i-1, -1, -1):
                    prev = lines[back].strip()
                    if prev and not re.fullmatch(r'\d+', prev) and not re.fullmatch(r'[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ]{2,}', prev):
                        kit_name = prev
                        break
                if not kit_name:
                    kit_name = f'Kit_{len(kits)+1}'
                nucleos = [n.strip() for n in line[len('Núcleos.'):].split(',') if n.strip()]
                current = {
                    'id': f"kit_{len(kits)+1:03}",
                    'nome': kit_name,
                    'nucleos': nucleos,
                    'exigencias': [],
                    'poderes': [],
                    'pagina_inicial': page_index + 1,
                }
                continue
            if not current:
                continue
            if line.startswith('Exigências.'):
                reqs = [r.strip(' .') for r in re.split('[,;]', line[len('Exigências.'):]) if r.strip()]
                current['exigencias'] = reqs
                continue
            if line.startswith('•'):
                if current_power_lines:
                    power_text = ' '.join(current_power_lines).strip()
                    m = re.match(r'([^\.]+)\.\s*(.*)', power_text)
                    if m:
                        name, desc = m.groups()
                    else:
                        parts = power_text.split(' ', 1)
                        name = parts[0]
                        desc = parts[1] if len(parts) > 1 else ''
                    current['poderes'].append({'nome': name, 'descricao': desc})
                    current_power_lines = []
                current_power_lines.append(line[1:].strip())
                continue
            if current_power_lines and title_re.match(line):
                power_text = ' '.join(current_power_lines).strip()
                m = re.match(r'([^\.]+)\.\s*(.*)', power_text)
                if m:
                    name, desc = m.groups()
                else:
                    parts = power_text.split(' ', 1)
                    name = parts[0]
                    desc = parts[1] if len(parts) > 1 else ''
                current['poderes'].append({'nome': name, 'descricao': desc})
                current_power_lines = []
                # treat current line as potential kit name later
                pass
            elif current_power_lines:
                current_power_lines.append(line)

    if current:
        if current_power_lines:
            power_text = ' '.join(current_power_lines).strip()
            m = re.match(r'([^\.]+)\.\s*(.*)', power_text)
            if m:
                name, desc = m.groups()
            else:
                parts = power_text.split(' ', 1)
                name = parts[0]
                desc = parts[1] if len(parts) > 1 else ''
            current['poderes'].append({'nome': name, 'descricao': desc})
            current_power_lines = []
        kits.append(current)

if not kits:
    raise SystemExit('⚠️ Nenhum kit localizado!')
for k in kits:
    if len(k['poderes']) != 3:
        print(f"⚠️ Kit {k['nome']} possui {len(k['poderes'])} poderes")

with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(kits, f, indent=2, ensure_ascii=False)

print(len(kits), [(k['id'], k['nome']) for k in kits[:3]])
