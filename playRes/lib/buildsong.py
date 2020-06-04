g = input("Drag file here: ");
g=g[1:];
g=g[:-2];

f = open(g, "r")

x = g.split('/');
g = x[len(x)-1][:-4].replace('_',' ');

print(g + ",");
h = input("is it free? (y/n): ");

if h == 'y':
    g += ",false,"
else:
    g += ",true,"

c = []
y = f.read().split('\n');
for i in range(8, len(y)-1, 3):
    if y[i] not in c:
        c.append(y[i]);
g += str(len(c))+','

d = True;
dt = [7,8,10,12,14,15,17,19];
for i in range(0,len(c)):
    if c[i] not in dt:
        d = False
g += str(d).lower()
print(g)
h = input("confirm? (y/n)");
if h == 'y':
    file_object = open('dat.txt', 'a')
    file_object.write('\n'+g)
    file_object.close()
